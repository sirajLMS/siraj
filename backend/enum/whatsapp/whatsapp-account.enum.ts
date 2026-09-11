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

/**
 * Classification of an access-token test failure, so the UI can tell a
 * Meta-side rejection (`INVALID_TOKEN` / `META_PERMISSIONS` / `META_ERROR`)
 * from a transport problem (`NETWORK_ERROR` — Meta unreachable, unparseable
 * response) and carry original composition. The GraphQL request-failure path
 * (Siraj auth/validation rejecting the mutation) never reaches the server
 * classification — the client marks that outcome without a kind.
 */
export enum WhatsappTokenTestFailureKind {
  /** Meta rejected the token itself (error code 190 / "Invalid OAuth access token"). */
  INVALID_TOKEN = "INVALID_TOKEN",
  /**
   * Token lacks asset permissions on Meta's side (error code 10/200): the
   * system user has no access to the number's WABA, or the token is missing
   * `whatsapp_business_management` / `whatsapp_business_messaging`.
   */
  META_PERMISSIONS = "META_PERMISSIONS",
  /** Any other Meta Graph API error. */
  META_ERROR = "META_ERROR",
  /** Meta reports the number's status is not CONNECTED (token is fine). */
  NOT_CONNECTED = "NOT_CONNECTED",
  /** Meta could not be reached or its response was not parseable. */
  NETWORK_ERROR = "NETWORK_ERROR",
}
