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

import { WhatsappAccountRepository, WhatsappSyncRequestRepository } from "@/backend/db/repo/whatsapp";
import { WhatsappSyncRequestStatus, WhatsappSyncStatus, WhatsappSyncType } from "@/backend/enum/whatsapp";
import { isValidSyncStatus, NotFoundError } from "@/backend/lib";
import { logger } from "@/backend/lib/logger";
import {
  CREDENTIALS_PLACEHOLDER,
  dispatchSyncType,
  type EnqueueBuckets,
  errorMessage,
  expireAccountSync,
  isTerminalAccountStatus,
  isTerminalRequest,
  maybeCompleteAccountSync,
  ONBOARDING_SYNC_TYPES,
  PROGRESS_COMPLETE,
  SYNC_WINDOW_MS,
  WHATSAPP_SYNC_FAILURE_DEADLINE,
  WHATSAPP_SYNC_FAILURE_HISTORY_DECLINED,
} from "@/backend/services/whatsapp/whatsapp-coexistence-sync.helpers";
import type {
  DBTransaction,
  WhatsappAccountSyncOverview,
  WhatsappSyncEnqueueResult,
  WhatsappSyncSweepResult,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";
import { getServerTranslations } from "@/shared/locale/server-graphql";

export { WHATSAPP_SYNC_FAILURE_DEADLINE, WHATSAPP_SYNC_FAILURE_HISTORY_DECLINED };

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
