/**
 * Internal helpers for the coexistence sync orchestrator (`whatsapp-coexistence-sync.service.ts`).
 * Holds the Meta `smb_app_data` POST primitive, the per-type ensure/POST/record
 * dispatch loop, and the account-level completion/expiry transitions so the
 * service module stays focused on the public orchestration entry points.
 */

import { z } from "zod";
import { WhatsappAccountRepository, WhatsappSyncRequestRepository } from "@/backend/db/repo/whatsapp";
import { WhatsappSyncRequestStatus, WhatsappSyncStatus, WhatsappSyncType } from "@/backend/enum/whatsapp";
import { logger } from "@/backend/lib/logger";
import { FETCH_TIMEOUT_MS, resolveGraphApiVersion } from "@/backend/lib/whatsapp-constants";
import { GraphApiError } from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import {
  buildSmbAppDataRequest,
  parseSmbAppDataResponse,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/requests";
import {
  noFollowRedirectInit,
  readJsonWithByteBudget,
  readResponseBodyWithByteBudget,
} from "@/backend/services/shared/outbound-fetch-guard";
import type {
  DBTransaction,
  RequestSmbAppDataSyncType,
  WhatsappAccountSelectType,
  WhatsappSyncRequestReturnType,
} from "@/backend/types";

/** Hard window after onboarding during which Meta accepts `smb_app_data` POSTs. */
export const SYNC_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Full progress marks history delivery complete. */
export const PROGRESS_COMPLETE = 100;

/**
 * Placeholder written by account creation before credentials are stored via
 * the dedicated credential mutations (mirrors the account service's
 * placeholder contract) — such accounts cannot authenticate to Meta yet.
 */
export const CREDENTIALS_PLACEHOLDER = "pending";

/** SyncFailureReason code: the 24h sync window closed before Meta accepted. */
export const WHATSAPP_SYNC_FAILURE_DEADLINE = "syncDeadlineExpired";

/** SyncFailureReason code: the business declined history sharing (Meta 2593109). */
export const WHATSAPP_SYNC_FAILURE_HISTORY_DECLINED = "historyDeclined";

/** Runtime shape of the Meta `smb_app_data` accept response. */
const smbAppDataResponseSchema = z.object({
  messaging_product: z.string(),
  request_id: z.string().optional(),
});

/** Sync types requested post-onboarding, in delivery-safe order. */
export const ONBOARDING_SYNC_TYPES: readonly WhatsappSyncType[] = [
  WhatsappSyncType.SMB_APP_STATE_SYNC,
  WhatsappSyncType.HISTORY,
];

/** DB enum → Meta wire value for the `sync_type` body field. */
const SYNC_TYPE_TO_WIRE: Readonly<Record<WhatsappSyncType, RequestSmbAppDataSyncType>> = {
  [WhatsappSyncType.SMB_APP_STATE_SYNC]: "smb_app_state_sync",
  [WhatsappSyncType.HISTORY]: "history",
};

export function isTerminalAccountStatus(status: WhatsappSyncStatus): boolean {
  return status === WhatsappSyncStatus.COMPLETE || status === WhatsappSyncStatus.FAILED;
}

function isTerminalRequestStatus(status: WhatsappSyncRequestStatus): boolean {
  return status === WhatsappSyncRequestStatus.COMPLETE || status === WhatsappSyncRequestStatus.FAILED;
}

export function isTerminalRequest(row: WhatsappSyncRequestReturnType): boolean {
  return isTerminalRequestStatus(row.status);
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * POST one `smb_app_data` sync type to Meta and return the accepted
 * `request_id`. Throws `GraphApiError` on non-2xx, or a plain `Error` on
 * network failure / unexpected response shape.
 */
async function postSmbAppDataSync(
  phoneNumberId: string,
  accessToken: string,
  syncType: WhatsappSyncType
): Promise<string> {
  const apiVersion = await resolveGraphApiVersion();
  const { url, init } = buildSmbAppDataRequest(
    { accessToken, apiVersion },
    { phoneNumberId, syncType: SYNC_TYPE_TO_WIRE[syncType] }
  );
  const response = await fetch(url, {
    ...init,
    ...noFollowRedirectInit(),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new GraphApiError(response.status, await readResponseBodyWithByteBudget(response));
  }
  const body = smbAppDataResponseSchema.parse(await readJsonWithByteBudget(response));
  return parseSmbAppDataResponse(body).requestId;
}

export type EnqueueBuckets = {
  requested: WhatsappSyncType[];
  alreadyRequested: WhatsappSyncType[];
  pending: WhatsappSyncType[];
};

/**
 * Ensure + (conditionally) POST + record one sync type. The requestId-guard
 * makes the POST conditional on "never accepted before": a retry after a
 * crash finds the recorded `requestId` and reports `alreadyRequested`. When
 * two workers race to POST the same type, the loser sees `recordRequestId`
 * return `null` (the `requestId IS NULL` guard) and treats the winner's POST
 * as the accepted one — no re-POST ever happens after a recorded accept.
 */
export async function dispatchSyncType(
  account: WhatsappAccountSelectType,
  accessToken: string,
  syncType: WhatsappSyncType,
  deadlineAt: Date,
  buckets: EnqueueBuckets
): Promise<void> {
  const { request } = await WhatsappSyncRequestRepository.ensure({
    accountId: account.id,
    syncType,
    status: WhatsappSyncRequestStatus.PENDING,
  });
  if (request.requestId !== null) {
    buckets.alreadyRequested.push(syncType);
    return;
  }
  if (isTerminalRequest(request)) {
    // One-shot slot already exhausted (deadline expiry / decline / delivery).
    return;
  }
  if (Date.now() > deadlineAt.getTime()) {
    // Window closed before Meta ever accepted — the sweeper expires the row.
    buckets.pending.push(syncType);
    return;
  }
  try {
    const requestId = await postSmbAppDataSync(account.phoneNumberId, accessToken, syncType);
    const recorded = await WhatsappSyncRequestRepository.recordRequestId(request.id, requestId);
    if (recorded) {
      buckets.requested.push(syncType);
    } else {
      // A concurrent worker's POST was recorded first — that POST is the
      // accepted one, so any further retry skips dispatching again.
      buckets.alreadyRequested.push(syncType);
    }
  } catch (error) {
    logger.logDomainError("whatsapp-coexistence-sync: smb_app_data POST failed; row left PENDING for retry", {
      accountId: account.id,
      syncType,
      error: errorMessage(error),
    });
    buckets.pending.push(syncType);
  }
}

/**
 * Flips every PENDING row to FAILED, sequentially (rows share the account's
 * transaction budget; bursts are not a goal for the sweeper).
 */
async function expirePendingRowsSequentially(
  rows: readonly WhatsappSyncRequestReturnType[],
  index: number
): Promise<void> {
  if (index >= rows.length) {
    return;
  }
  const row = rows[index];
  if (row.status === WhatsappSyncRequestStatus.PENDING) {
    await WhatsappSyncRequestRepository.updateStatus(row.id, WhatsappSyncRequestStatus.FAILED);
  }
  await expirePendingRowsSequentially(rows, index + 1);
}

/**
 * Flips a PENDING row set to FAILED once the deadline has passed, then marks
 * the account terminal with the deadline reason (an accepted-but-unfinished
 * sync can no longer be completed — the one-shot window is gone).
 */
export async function expireAccountSync(accountId: string): Promise<void> {
  const rows = await WhatsappSyncRequestRepository.listByAccount(accountId);
  await expirePendingRowsSequentially(rows, 0);
  await WhatsappAccountRepository.markSyncFailed(accountId, WHATSAPP_SYNC_FAILURE_DEADLINE);
  logger.info("whatsapp-coexistence-sync: sync deadline expired", { accountId });
}

/** Complete the sync lifecycle if both streams have finished. */
export async function maybeCompleteAccountSync(accountId: string, tx?: DBTransaction): Promise<void> {
  const historyRow = await WhatsappSyncRequestRepository.findByAccountAndType(accountId, WhatsappSyncType.HISTORY, tx);
  const account = await WhatsappAccountRepository.findById(accountId, tx);
  if (!account || isTerminalAccountStatus(account.syncStatus)) {
    return;
  }
  if (historyRow?.status === WhatsappSyncRequestStatus.COMPLETE) {
    await WhatsappAccountRepository.markSyncComplete(accountId, tx);
    return;
  }
  if (historyRow?.status === WhatsappSyncRequestStatus.FAILED) {
    // History dead-ended (decline); contacts completion is the final state.
    await WhatsappAccountRepository.markSyncFailed(accountId, WHATSAPP_SYNC_FAILURE_HISTORY_DECLINED, tx);
    return;
  }
  await WhatsappAccountRepository.markSyncProgress(accountId, { progress: account.syncProgress }, tx);
}
