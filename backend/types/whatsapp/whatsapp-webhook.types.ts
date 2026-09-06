/**
 * Webhook entry from Meta Cloud API.
 *
 * NOTE: The `Type` suffix on these interfaces is intentional. They represent
 * the **payload shape** of incoming Meta webhook events, not Drizzle entity
 * types. The canonical backend type convention (`{Entity}SelectType` /
 * `{Entity}ReturnType` / `{Entity}SubmitInput`) applies to database entity
 * types defined in `backend/types/`. Meta webhook payloads have no
 * corresponding Drizzle table, so they are deliberately named `*Type`
 * to distinguish them from the `SelectType`/`ReturnType`/`SubmitInput`
 * pattern used for database entities.
 */
export interface WebhookEntryType {
  id?: string;
  changes?: WebhookChangeType[];
}

/**
 * Webhook change entry.
 *
 * @see WebhookEntryType JSDoc for why the `Type` suffix is intentional.
 */
export interface WebhookChangeType {
  field?: string;
  value?: Record<string, unknown>;
}

/**
 * Status update payload from Meta webhook.
 *
 * @see WebhookEntryType JSDoc for why the `Type` suffix is intentional.
 */
export interface WebhookError {
  code: number;
  title?: string;
  message?: string;
  error_data?: { details?: string };
}

export interface WebhookStatusUpdateType {
  id: string;
  status: string;
  timestamp?: string;
  recipient_id?: string;
  errors?: WebhookError[];
}

/**
 * Template lifecycle event payload.
 *
 * @see WebhookEntryType JSDoc for why the `Type` suffix is intentional.
 */
export interface WebhookTemplateEventType {
  message_template_id?: string;
  message_template_name?: string;
  message_template_language?: string;
  event?: string;
  reason?: string;
  /** Template category from `template_category_update` webhook events. */
  category?: string;
}

/* ---------------------------------------------------------------------------
 * Coexistence webhook payload shapes (history / smb_app_state_sync /
 * smb_message_echoes / account_update / business_capability_update).
 *
 * These mirror Meta's documented webhook value shapes. All foreign fields are
 * optional where Meta conditionally includes them; the usernames rollout means
 * phone-based ids may be absent in favor of BSUID/user_id fields.
 * ------------------------------------------------------------------------- */

/** Per-phone metadata block carried by history/state-sync/echo change values. */
export interface WebhookPhoneMetadataType {
  display_phone_number?: string;
  phone_number_id?: string;
}

export interface WebhookHistoryChunkMetadataType {
  /** History phase: 0 = day 0–1, 1 = day 1–90, 2 = day 90–180. */
  phase: number;
  /** Chunk reassembly key — webhook delivery order is not guaranteed. */
  chunk_order: number;
  /** 0–100; 100 means this sync is complete. */
  progress: number;
}

export interface WebhookHistoryThreadContextType {
  /** Phone-based WhatsApp id; may be absent under the usernames rollout. */
  wa_id?: string;
  /** Business-scoped user id (BSUID). */
  user_id?: string;
  parent_user_id?: string;
  username?: string;
}

/**
 * Shared message core for history-thread messages and SMB echoes:
 * `id` is the wamid (global dedupe key); the per-type content object sits on
 * the property named by `type` (`text`, `image`, `media_placeholder`, …).
 */
interface WebhookBaseMessageType {
  /** wamid — global message dedupe key. */
  id: string;
  /** Sender phone; may be omitted under the usernames rollout. */
  from?: string;
  from_user_id?: string;
  from_parent_user_id?: string;
  /** Recipient phone; present on business→user echoes. */
  to?: string;
  to_user_id?: string;
  to_parent_user_id?: string;
  /** Device-time Unix timestamp string. */
  timestamp?: string;
  /** Message type key; the same-named property carries the content object. */
  type?: string;
  /** Per-type content object keyed by `type`. */
  [contentKey: string]: unknown;
}

export interface WebhookHistoryMessageType extends WebhookBaseMessageType {
  history_context?: { status?: string };
}

export interface WebhookHistoryThreadType {
  /** Peer phone number; may be omitted under the usernames rollout. */
  id?: string;
  context: WebhookHistoryThreadContextType;
  messages: WebhookHistoryMessageType[];
}

export interface WebhookHistoryChunkType {
  metadata: WebhookHistoryChunkMetadataType;
  threads: WebhookHistoryThreadType[];
  /**
   * Non-empty when the business declined history sharing from the Business
   * app (code 2593109). Contacts sync is unaffected by this decline.
   */
  errors?: WebhookError[];
}

export interface WebhookHistoryValueType {
  metadata?: WebhookPhoneMetadataType;
  /** History chunks; absent on the separate media follow-up delivery. */
  history?: WebhookHistoryChunkType[];
  /** Follow-up media content for user→business history messages. */
  messages?: WebhookHistoryMessageType[];
  /** Follow-up media content for business→user history messages. */
  message_echoes?: WebhookMessageEchoType[];
}

export type WebhookContactSyncAction = "add" | "remove";

export interface WebhookSyncedContactType {
  /** Omitted when the contact was removed. */
  full_name?: string;
  first_name?: string;
  phone_number?: string;
  /** Business-scoped user id (BSUID). */
  user_id?: string;
  parent_user_id?: string;
  username?: string;
}

export interface WebhookContactSyncItemType {
  type?: "contact";
  contact: WebhookSyncedContactType;
  /** Both contact creation and contact edits arrive as "add". */
  action: WebhookContactSyncAction;
  /** `timestamp` (Unix) drives last-writer-wins ordering for add/remove. */
  metadata?: { timestamp?: string };
}

export interface WebhookAppStateSyncValueType {
  messaging_product?: string;
  metadata?: WebhookPhoneMetadataType;
  state_sync: WebhookContactSyncItemType[];
}

export interface WebhookMessageEchoType extends WebhookBaseMessageType {
  /** Revoke marker: deletes the previously sent message. */
  revoke?: { original_message_id?: string };
  /** Edit marker: replacement content nested under `message`. */
  edit?: { original_message_id?: string; message?: Record<string, unknown> };
}

export interface WebhookMessageEchoContactType {
  profile?: { name?: string; username?: string };
  wa_id?: string;
  user_id?: string;
  parent_user_id?: string;
}

export interface WebhookMessageEchoesValueType {
  messaging_product?: string;
  metadata?: WebhookPhoneMetadataType;
  contacts?: WebhookMessageEchoContactType[];
  message_echoes: WebhookMessageEchoType[];
}

/**
 * `account_update` lifecycle events. The payload parsers must tolerate
 * events outside this list (Meta adds new event names without versioning).
 */
export type WebhookAccountUpdateEvent =
  | "PARTNER_ADDED"
  | "PARTNER_APP_INSTALLED"
  | "PARTNER_APP_UNINSTALLED"
  | "PARTNER_REMOVED"
  | "ACCOUNT_OFFBOARDED"
  | "ACCOUNT_RECONNECTED"
  | "DISABLED_UPDATE"
  | "VERIFIED_ACCOUNT";

export type WebhookPartnerDisconnectionReason =
  | "ACCOUNT_DISCONNECTED"
  | "BUSINESS_DOWNGRADE"
  | "CHANGE_NUMBER"
  | "COMPANION_INACTIVITY"
  | "PRIMARY_INACTIVITY"
  | "USER_RE_REGISTERED";

export type WebhookWabaBanState = "SCHEDULE_FOR_DISABLE" | "DISABLE" | "REINSTATE";

export interface WebhookAccountUpdateValueType {
  /** A `WebhookAccountUpdateEvent`, or any unlisted future event string. */
  event?: string;
  phone_number?: string;
  waba_id?: string;
  /** Present on PARTNER_REMOVED (coexistence disconnect). */
  disconnection_info?: { reason?: string };
  /** Present on DISABLED_UPDATE (WABA ban state change). */
  ban_info?: { waba_ban_state?: string };
}

/**
 * `business_capability_update` value — parsing must be maximally tolerant:
 * `max_daily_conversations_per_business` arrives as TIER_* strings or
 * integer-style values (v24.0+ only); the legacy per-phone field is the only
 * one sent on older webhook versions; number caps are conditionally included,
 * so absence is NOT "no cap".
 */
export interface WebhookBusinessCapabilityUpdateValueType {
  max_daily_conversations_per_business?: string | number;
  max_daily_conversation_per_phone?: number;
  max_phone_numbers_per_business?: number;
  max_phone_numbers_per_waba?: number;
}

/**
 * Discriminated union of the typed per-field change shapes the durable ingest
 * worker dispatches on. Fields not listed here keep the generic
 * `WebhookChangeType` (`value: Record<string, unknown>`) representation.
 */
export type WebhookTypedChangeType =
  | { field: "history"; value: WebhookHistoryValueType }
  | { field: "smb_app_state_sync"; value: WebhookAppStateSyncValueType }
  | { field: "smb_message_echoes"; value: WebhookMessageEchoesValueType }
  | { field: "account_update"; value: WebhookAccountUpdateValueType }
  | { field: "business_capability_update"; value: WebhookBusinessCapabilityUpdateValueType };
