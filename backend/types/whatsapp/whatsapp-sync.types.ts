import type { whatsappSyncRequests } from "@/backend/db/schema";
import type {
  WhatsappSyncRequestStatus,
  WhatsappSyncStatus,
  WhatsappSyncType,
} from "@/backend/enum/whatsapp/whatsapp-account.enum";

/**
 * Canonical type definitions for the `whatsapp_sync_requests` entity.
 *
 * Each row tracks one exactly-once `POST smb_app_data` call: Meta accepts
 * each `syncType` at most once per onboarding (and only within 24 hours of
 * it), so the row is the durable guard against duplicate requests.
 * `requestId` (from Meta's accept response) is a support/diagnostic handle —
 * follow-up webhooks never echo it, so nothing correlates webhooks through it.
 */

export type WhatsappSyncRequestSelectType = typeof whatsappSyncRequests.$inferSelect;
export type WhatsappSyncRequestInsertType = typeof whatsappSyncRequests.$inferInsert;

export type WhatsappSyncRequestReturnType = Omit<WhatsappSyncRequestSelectType, "syncType" | "status"> & {
  syncType: WhatsappSyncType; // Re-apply enum
  status: WhatsappSyncRequestStatus; // Re-apply enum
};

/**
 * Result envelope of the idempotent sync-request enqueue: `created` tells the
 * caller whether this call inserted the row (true) or the one-shot unique
 * (accountId, syncType) guard matched a pre-existing row (false). Not a table.
 */
export type WhatsappSyncRequestEnsureResult = {
  readonly request: WhatsappSyncRequestReturnType;
  readonly created: boolean;
};

/**
 * Account-level view of the post-onboarding sync lifecycle, returned by the
 * coexistence sync service and exposed through the sync-status query.
 * Derived from account columns plus the per-type request rows — not a table.
 */
export type WhatsappAccountSyncOverview = {
  readonly accountId: string;
  readonly syncStatus: WhatsappSyncStatus;
  readonly syncPhase: number | null;
  readonly syncProgress: number;
  readonly syncDeadlineAt: Date | null;
  readonly syncFailureReason: string | null;
  readonly requests: readonly WhatsappSyncRequestReturnType[];
};

/**
 * Outcome of one `enqueuePostOnboardingSync` call. Every sync type lands in
 * exactly one bucket:
 * - `requested` — Meta accepted the POST during THIS call (requestId freshly recorded);
 * - `alreadyRequested` — a previously accepted `requestId` is on record, so no
 *   re-POST happened (the one-shot guard);
 * - `pending` — no accepted request yet and no POST this call either (transient
 *   failure, expired window, or exhausted one-shot); the deadline sweeper
 *   retries or expires these.
 */
export type WhatsappSyncEnqueueResult = {
  readonly accountId: string;
  readonly requested: readonly WhatsappSyncType[];
  readonly alreadyRequested: readonly WhatsappSyncType[];
  readonly pending: readonly WhatsappSyncType[];
};

/** Aggregate outcome of one deadline-sweeper tick. */
export type WhatsappSyncSweepResult = {
  /** Accounts with PENDING request rows that the tick examined. */
  readonly checkedAccounts: number;
  /** Accounts whose 24h window closed with un-requested syncs → FAILED. */
  readonly expiredAccounts: number;
  /** Accounts still inside the window whose pending POSTs were retried. */
  readonly retriedAccounts: number;
};
