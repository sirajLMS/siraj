/**
 * Coexistence sync orchestrator — drives the one-shot `smb_app_data`
 * contacts/history sync that Meta allows once per coexistence onboarding,
 * inside a hard 24-hour window.
 *
 * Durability model: each sync type has exactly one `whatsapp_sync_requests`
 * row (unique `(accountId, syncType)`). The POST to Meta is the point of no
 * return, so the sequence per type is: ensure row (PENDING) → POST →
 * immediately persist the accepted `requestId` in its own committed write.
 * The `requestId IS NULL` guard in the repository makes any retry a no-op
 * after a successful accept — a retry after a crash never double-POSTs.
 *
 * Terminal failure reasons are machine codes stored on the account's
 * `syncFailureReason` column; the UI maps them to localized copy.
 */

import { z } from "zod";
import { WhatsappAccountRepository, WhatsappSyncRequestRepository } from "@/backend/db/repo/whatsapp";
import { WhatsappSyncRequestStatus, WhatsappSyncStatus, WhatsappSyncType } from "@/backend/enum/whatsapp";
import { isValidSyncStatus, NotFoundError } from "@/backend/lib";
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
  WhatsappAccountSyncOverview,
  WhatsappSyncEnqueueResult,
  WhatsappSyncRequestReturnType,
  WhatsappSyncSweepResult,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";
import { getServerTranslations } from "@/shared/locale/server-graphql";

/** Hard window after onboarding during which Meta accepts `smb_app_data` POSTs. */
const SYNC_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Full progress marks history delivery complete. */
const PROGRESS_COMPLETE = 100;

/**
 * Placeholder written by account creation before credentials are stored via
 * the dedicated credential mutations (mirrors the account service's
 * placeholder contract) — such accounts cannot authenticate to Meta yet.
 */
const CREDENTIALS_PLACEHOLDER = "pending";

/** Runtime shape of the Meta `smb_app_data` accept response. */
const smbAppDataResponseSchema = z.object({
  messaging_product: z.string(),
  request_id: z.string().optional(),
});

/** Sync types requested post-onboarding, in delivery-safe order. */
const ONBOARDING_SYNC_TYPES: readonly WhatsappSyncType[] = [
  WhatsappSyncType.SMB_APP_STATE_SYNC,
  WhatsappSyncType.HISTORY,
];

/** DB enum → Meta wire value for the `sync_type` body field. */
const SYNC_TYPE_TO_WIRE: Readonly<Record<WhatsappSyncType, RequestSmbAppDataSyncType>> = {
  [WhatsappSyncType.SMB_APP_STATE_SYNC]: "smb_app_state_sync",
  [WhatsappSyncType.HISTORY]: "history",
};

/** SyncFailureReason code: the 24h sync window closed before Meta accepted. */
export const WHATSAPP_SYNC_FAILURE_DEADLINE = "syncDeadlineExpired";

/** SyncFailureReason code: the business declined history sharing (Meta 2593109). */
export const WHATSAPP_SYNC_FAILURE_HISTORY_DECLINED = "historyDeclined";

function isTerminalAccountStatus(status: WhatsappSyncStatus): boolean {
  return status === WhatsappSyncStatus.COMPLETE || status === WhatsappSyncStatus.FAILED;
}

function isTerminalRequestStatus(status: WhatsappSyncRequestStatus): boolean {
  return status === WhatsappSyncRequestStatus.COMPLETE || status === WhatsappSyncRequestStatus.FAILED;
}

function isTerminalRequest(row: WhatsappSyncRequestReturnType): boolean {
  return isTerminalRequestStatus(row.status);
}

function errorMessage(error: unknown): string {
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

type EnqueueBuckets = {
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
async function dispatchSyncType(
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
async function expireAccountSync(accountId: string): Promise<void> {
  const rows = await WhatsappSyncRequestRepository.listByAccount(accountId);
  await expirePendingRowsSequentially(rows, 0);
  await WhatsappAccountRepository.markSyncFailed(accountId, WHATSAPP_SYNC_FAILURE_DEADLINE);
  logger.info("whatsapp-coexistence-sync: sync deadline expired", { accountId });
}

/** Complete the sync lifecycle if both streams have finished. */
async function maybeCompleteAccountSync(accountId: string, tx?: DBTransaction): Promise<void> {
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

export namespace WhatsappCoexistenceSyncService {
  /**
   * Enqueue the one-shot post-onboarding sync for a coexistence account:
   * ensures both sync-request rows, POSTs each outstanding type to Meta,
   * persists accepted `requestId`s, and flips the account to REQUESTED with
   * its 24h deadline. Fully retry-safe — a re-run never re-POSTs a type that
   * Meta already accepted.
   *
   * This function deliberately takes NO caller transaction: the Meta POSTs
   * are network I/O sitting between row writes, and holding a caller's
   * transaction open across them pins a connection for the round-trip. Every
   * repository call here makes its own short, self-committed write (the
   * `requestId IS NULL` record guard keeps that retry-safe). Callers must
   * invoke it only after the account row itself is committed.
   *
   * `tErrors` (optional) localizes the NotFoundError for missing accounts;
   * system-context callers (the sweeper) fall back to English.
   *
   * @throws NotFoundError when the account row does not exist.
   */
  export async function enqueuePostOnboardingSync(
    accountId: string,
    tErrors?: ErrorsLabels
  ): Promise<WhatsappSyncEnqueueResult> {
    const account = await WhatsappAccountRepository.findRawById(accountId);
    if (!account) {
      const errors = tErrors ?? getServerTranslations("en").errorsTranslations;
      throw new NotFoundError("WHATSAPP_ACCOUNT", errors.whatsappAccountNotFound(accountId));
    }

    const buckets: EnqueueBuckets = { requested: [], alreadyRequested: [], pending: [] };

    if (account.offboardedAt !== null) {
      // Offboarded numbers cannot be re-synced; recovery is a full ES re-run.
      logger.logDomainError("whatsapp-coexistence-sync: enqueue skipped — account is offboarded", { accountId });
      return { accountId, ...buckets };
    }

    // The sync window is anchored to onboarding (account creation). Stamp the
    // deadline even when POSTs fail so the sweeper can expire the account.
    const deadlineAt = account.syncDeadlineAt ?? new Date(account.createdAt.getTime() + SYNC_WINDOW_MS);
    if (account.syncDeadlineAt === null) {
      await WhatsappAccountRepository.update(accountId, { syncDeadlineAt: deadlineAt });
    }

    const accessToken = account.encryptedAccessToken;
    const hasUsableToken =
      accessToken !== null && accessToken.trim().length > 0 && accessToken !== CREDENTIALS_PLACEHOLDER;
    if (!hasUsableToken) {
      logger.warn("whatsapp-coexistence-sync: enqueue skipped — account has no access token", { accountId });
      return { accountId, ...buckets };
    }

    await ONBOARDING_SYNC_TYPES.reduce(
      (chain, syncType) => chain.then(() => dispatchSyncType(account, accessToken, syncType, deadlineAt, buckets)),
      Promise.resolve()
    );

    const currentSyncStatus = isValidSyncStatus(account.syncStatus)
      ? account.syncStatus
      : WhatsappSyncStatus.NOT_STARTED;
    if (
      currentSyncStatus === WhatsappSyncStatus.NOT_STARTED &&
      buckets.requested.length + buckets.alreadyRequested.length > 0
    ) {
      await WhatsappAccountRepository.markSyncRequested(accountId, deadlineAt);
    }

    return { accountId, ...buckets };
  }

  /**
   * Deadline sweeper tick: for every account with PENDING request rows,
   * expire it once the 24h window has closed (rows → FAILED, account →
   * FAILED/`syncDeadlineExpired`), or retry the outstanding POSTs while the
   * window is still open. Best-effort per account; one failure never blocks
   * the rest of the sweep.
   */
  export async function sweepExpiredSyncs(now: Date = new Date()): Promise<WhatsappSyncSweepResult> {
    const accountIds = await WhatsappSyncRequestRepository.listPendingAccountIds();
    const tallies = { checkedAccounts: 0, expiredAccounts: 0, retriedAccounts: 0 };

    const sweepAccount = async (accountId: string): Promise<void> => {
      try {
        const account = await WhatsappAccountRepository.findById(accountId);
        if (!account || isTerminalAccountStatus(account.syncStatus)) {
          return;
        }
        tallies.checkedAccounts++;
        const deadline = account.syncDeadlineAt;
        if (deadline !== null && deadline.getTime() <= now.getTime()) {
          await expireAccountSync(accountId);
          tallies.expiredAccounts++;
        } else {
          await enqueuePostOnboardingSync(accountId);
          tallies.retriedAccounts++;
        }
      } catch (error) {
        logger.error("whatsapp-coexistence-sync: sweep tick failed for account", {
          accountId,
          error: errorMessage(error),
        });
      }
    };

    // Sequential: each sweep touches Meta + DB; bursts are not the goal.
    await accountIds.reduce((chain, accountId) => chain.then(() => sweepAccount(accountId)), Promise.resolve());

    return tallies;
  }

  /**
   * Meta declined history sharing (webhook error 2593109). The history row
   * terminally fails; the contacts stream may still complete on its own.
   * When contacts are already terminal, the account flips to
   * FAILED/`historyDeclined` immediately.
   */
  export async function handleHistoryDeclined(accountId: string, tx?: DBTransaction): Promise<boolean> {
    const historyRow = await WhatsappSyncRequestRepository.findByAccountAndType(
      accountId,
      WhatsappSyncType.HISTORY,
      tx
    );
    if (!historyRow) {
      logger.logDomainError("whatsapp-coexistence-sync: history decline for account without a history row", {
        accountId,
      });
      return false;
    }
    // A completed history sync outranks a late decline webhook entirely.
    if (historyRow.status === WhatsappSyncRequestStatus.COMPLETE) {
      return true;
    }
    if (historyRow.status !== WhatsappSyncRequestStatus.FAILED) {
      await WhatsappSyncRequestRepository.updateStatus(historyRow.id, WhatsappSyncRequestStatus.FAILED, tx);
    }

    const account = await WhatsappAccountRepository.findById(accountId, tx);
    if (!account || isTerminalAccountStatus(account.syncStatus)) {
      return true;
    }
    const stateRow = await WhatsappSyncRequestRepository.findByAccountAndType(
      accountId,
      WhatsappSyncType.SMB_APP_STATE_SYNC,
      tx
    );
    if (!stateRow || isTerminalRequest(stateRow)) {
      await WhatsappAccountRepository.markSyncFailed(accountId, WHATSAPP_SYNC_FAILURE_HISTORY_DECLINED, tx);
    }
    return true;
  }

  /**
   * Apply a `history` webhook chunk's `phase`/`progress` to the account and
   * its history request row. Idempotent under Meta chunk redelivery: terminal
   * rows ignore further progress, and progress=100 completes the account only
   * once the contacts stream has also completed.
   */
  export async function recordHistoryProgress(
    accountId: string,
    phase: number,
    progress: number,
    tx?: DBTransaction
  ): Promise<void> {
    const historyRow = await WhatsappSyncRequestRepository.findByAccountAndType(
      accountId,
      WhatsappSyncType.HISTORY,
      tx
    );
    if (!historyRow) {
      logger.logDomainError("whatsapp-coexistence-sync: history progress for account without a history row", {
        accountId,
      });
      return;
    }
    if (isTerminalRequest(historyRow)) {
      return;
    }

    const clamped = Math.min(Math.max(progress, 0), PROGRESS_COMPLETE);
    if (clamped >= PROGRESS_COMPLETE) {
      await WhatsappSyncRequestRepository.updateStatus(historyRow.id, WhatsappSyncRequestStatus.COMPLETE, tx);
      await WhatsappAccountRepository.markSyncProgress(accountId, { phase, progress: clamped }, tx);
      await maybeCompleteAccountSync(accountId, tx);
      return;
    }
    if (historyRow.status !== WhatsappSyncRequestStatus.STREAMING) {
      await WhatsappSyncRequestRepository.updateStatus(historyRow.id, WhatsappSyncRequestStatus.STREAMING, tx);
    }
    await WhatsappAccountRepository.markSyncProgress(accountId, { phase, progress: clamped }, tx);
  }

  /**
   * Mark the contacts (`smb_app_state_sync`) stream as fully applied. The
   * account completes only when history has also completed; a declined
   * history surfaces the decline as the terminal account state.
   */
  export async function markContactsSyncComplete(accountId: string, tx?: DBTransaction): Promise<boolean> {
    const stateRow = await WhatsappSyncRequestRepository.findByAccountAndType(
      accountId,
      WhatsappSyncType.SMB_APP_STATE_SYNC,
      tx
    );
    if (!stateRow) {
      logger.logDomainError("whatsapp-coexistence-sync: contacts completion for account without a state row", {
        accountId,
      });
      return false;
    }
    if (stateRow.status !== WhatsappSyncRequestStatus.COMPLETE) {
      await WhatsappSyncRequestRepository.updateStatus(stateRow.id, WhatsappSyncRequestStatus.COMPLETE, tx);
    }
    await maybeCompleteAccountSync(accountId, tx);
    return true;
  }

  /**
   * Account-level sync overview for the Numbers tab / inbox status surfaces.
   * Returns `null` when the account does not exist.
   */
  export async function getSyncStatus(
    accountId: string,
    tx?: DBTransaction
  ): Promise<WhatsappAccountSyncOverview | null> {
    const account = await WhatsappAccountRepository.findById(accountId, tx);
    if (!account) {
      return null;
    }
    const requests = await WhatsappSyncRequestRepository.listByAccount(accountId, tx);
    return {
      accountId: account.id,
      syncStatus: account.syncStatus,
      syncPhase: account.syncPhase,
      syncProgress: account.syncProgress,
      syncDeadlineAt: account.syncDeadlineAt,
      syncFailureReason: account.syncFailureReason,
      requests,
    };
  }
}
