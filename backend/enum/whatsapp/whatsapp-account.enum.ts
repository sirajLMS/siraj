/**
 * WhatsApp account lifecycle enums (multi-number + coexistence).
 *
 * Backend-only enums: canonical definitions live here (not in `shared/constants/`,
 * because these values are never needed cross-layer in plaintext) and are wired
 * into the PG dialect via `createPgEnumFromEnum` in `backend/db/schema/enums.ts`
 * and into GraphQL via `backend/graphql/pothos/shared/enum.pothos.ts`.
 */

/**
 * Routing purpose of a WhatsApp sender number. Notification dispatch resolves
 * the sending account by purpose (falling back to GENERAL); the inbox lists
 * conversations grouped by the owning account's purpose.
 */
export enum WhatsappAccountPurpose {
  GENERAL = "GENERAL",
  ADVERTISING = "ADVERTISING",
  STUDENTS = "STUDENTS",
}

/**
 * How the WhatsApp account was connected. COEXISTENCE numbers keep the
 * consumer-shaped Business app active alongside Cloud API access, which gates
 * the one-shot post-onboarding sync lifecycle.
 */
export enum WhatsappOnboardingMode {
  CLOUD_API = "CLOUD_API",
  COEXISTENCE = "COEXISTENCE",
}

/**
 * Account-level coexistence sync state machine:
 * NOT_STARTED -> REQUESTED (smb_app_data accepted) -> SYNCING (chunks arriving)
 * -> COMPLETE (progress 100) | FAILED (decline / 24h deadline / offboard).
 */
export enum WhatsappSyncStatus {
  NOT_STARTED = "NOT_STARTED",
  REQUESTED = "REQUESTED",
  SYNCING = "SYNCING",
  COMPLETE = "COMPLETE",
  FAILED = "FAILED",
}

/**
 * The two exactly-once sync streams Meta accepts via `POST smb_app_data`
 * within 24 hours of coexistence onboarding.
 */
export enum WhatsappSyncType {
  SMB_APP_STATE_SYNC = "SMB_APP_STATE_SYNC",
  HISTORY = "HISTORY",
}

/**
 * Per-(accountId, syncType) request-tracking status. REQUESTED means Meta
 * accepted the call (`request_id` recorded); STREAMING means follow-up
 * webhooks are arriving; COMPLETE/FAILED are terminal.
 */
export enum WhatsappSyncRequestStatus {
  PENDING = "PENDING",
  REQUESTED = "REQUESTED",
  STREAMING = "STREAMING",
  COMPLETE = "COMPLETE",
  FAILED = "FAILED",
}
