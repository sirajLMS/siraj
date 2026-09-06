import { NotificationRepository } from "@/backend/db/repo/notifications/notification.repository";
import { UserRepository } from "@/backend/db/repo/users/user.repository";
import { WhatsappAccountRepository, WhatsappWebhookEventRepository } from "@/backend/db/repo/whatsapp";
import { NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/backend/enum";
import { WhatsappSyncStatus } from "@/backend/enum/whatsapp/whatsapp-account.enum";
import { coerceQualityRating } from "@/backend/lib";
import { logger } from "@/backend/lib/logger";
import { sanitizeFailureReason } from "@/backend/lib/whatsapp-sanitize";
import { resetWhatsappChannel } from "@/backend/services/communication/channels/whatsapp/WhatsappChannelFactory";
import { AuditService } from "@/backend/services/system/audit.service";
import { WhatsappAccountService } from "@/backend/services/whatsapp";
import {
  ingestEchoesValue,
  ingestHistoryValue,
  ingestInboundMessages,
  ingestStateSyncValue,
} from "@/backend/services/whatsapp/whatsapp-webhook-inbox.helpers";
import {
  isRecord,
  isValidWamid,
  resolveAccountByPhoneNumberId,
  resolveLifecycleAccount,
  toSafeString,
} from "@/backend/services/whatsapp/whatsapp-webhook-ingest.helpers";
import type {
  CreateAuditLogInput,
  WebhookStatusUpdateType as StatusUpdate,
  WebhookTemplateEventType as TemplateEvent,
  WebhookChangeType,
  WebhookEntryType,
  WhatsappAccountReturnType,
  WhatsappAccountUpdateInput,
  WhatsappWebhookSweepResult,
  WhatsappWebhookWorkerResult,
} from "@/backend/types";

/**
 * WhatsApp webhook handler — processes inbound webhook events from Meta Cloud API.
 *
 * Durable ingest model: the route persists one `whatsapp_webhook_events` row
 * per change BEFORE acking 200; `after()` and the sweeper cron then call
 * `processPendingWebhookEvents` / `sweepPendingWebhookEvents`, which claim
 * PENDING rows (SKIP LOCKED → PROCESSING), dispatch them through the
 * per-field handlers below, and mark PROCESSED. Failed dispatches stay
 * PROCESSING and are re-claimed by the sweeper once their backoff horizon
 * elapses; rows that exhaust the attempt budget are parked FAILED.
 *
 * `processEvent` remains as the in-memory dispatcher over a raw body (status
 * delivery path parity + tests); the durable row path is the production flow.
 *
 * Security: payloads are untrusted parsed JSON (guard-narrowed, never logged
 * w/ content); failures log ids and counts only.
 */

/** Sync failure reason when Meta offboards a number mid-sync. */
export const WHATSAPP_SYNC_FAILURE_ACCOUNT_OFFBOARDED = "accountOffboarded";

/** Events the inbox dispatcher handles (others fall through to the generic path). */
const EVENT_CLAIM_LIMIT = 100;
const SWEEP_CLAIM_LIMIT = 100;
const SWEEP_MAX_ROUNDS = 10;
const WEBHOOK_EVENT_MAX_ATTEMPTS = 8;
const SWEEP_BACKOFF_BASE_MS = 60_000;

/** Meta account_update disconnection reasons observed on PARTNER_REMOVED. */
const PARTNER_DISCONNECTION_REASONS = new Set([
  "ACCOUNT_DISCONNECTED",
  "BUSINESS_DOWNGRADE",
  "CHANGE_NUMBER",
  "COMPANION_INACTIVITY",
  "PRIMARY_INACTIVITY",
  "USER_RE_REGISTERED",
]);

export const WhatsappWebhookHandler = {
  /**
   * In-memory dispatcher over a raw webhook body — used by legacy call sites
   * and tests. The production path persists events durably and processes
   * them via {@link WhatsappWebhookHandler.processPendingWebhookEvents}.
   */
  async processEvent(webhookBody: unknown): Promise<void> {
    if (!isRecord(webhookBody)) {
      logger.warn("whatsapp-webhook-handler: no entry array");
      return;
    }
    const rawEntry = webhookBody.entry;
    if (!Array.isArray(rawEntry)) {
      logger.warn("whatsapp-webhook-handler: no entry array");
      return;
    }
    const recipientUserIdCache = new Map<string, string | null>();
    const changePromises: Promise<void>[] = [];
    for (const entry of rawEntry) {
      if (isWebhookEntry(entry)) {
        collectEntryChanges(entry, changePromises, recipientUserIdCache);
      }
    }
    const results = await Promise.allSettled(changePromises);
    for (const result of results) {
      logRejectedResult(result, "unhandled rejection in change processing");
    }
  },

  /**
   * Claim a batch of durable PENDING events and dispatch each through the
   * per-field handlers. A claimed row whose dispatch throws stays PROCESSING
   * (its `attempts` counter already incremented by the claim) and is
   * re-claimed by the sweeper after its backoff horizon; success flips it to
   * PROCESSED. Rows whose stored payload is structurally unusable are
   * terminally failed instead.
   */
  async processPendingWebhookEvents(limit = EVENT_CLAIM_LIMIT): Promise<WhatsappWebhookWorkerResult> {
    const events = await WhatsappWebhookEventRepository.claimBatch(limit);
    const { processed, failed } = await drainClaimedEvents(events);
    return { claimed: events.length, processed, failed };
  },

  /**
   * Sweeper tick: park poison rows that exhausted the attempt budget, then
   * drain eligible stale events with an exponentially widening retry delay
   * (per-attempt backoff anchored at receipt time). Bounded rounds keep one
   * tick from monopolizing the worker.
   */
  async sweepPendingWebhookEvents(maxAttempts = WEBHOOK_EVENT_MAX_ATTEMPTS): Promise<WhatsappWebhookSweepResult> {
    const parked = await WhatsappWebhookEventRepository.parkExhausted(maxAttempts);
    if (parked > 0) {
      logger.error("whatsapp-webhook-handler: poison webhook events parked after exhausting retries", { parked });
    }
    const tallies = await drainSweepRounds(0, { claimed: 0, processed: 0, failed: 0 });
    return { ...tallies, parked };
  },
};

/** Per-event dispatch + markProcessed for the durable row runners. */
async function dispatchEventRow(eventId: string, field: string, payload: Record<string, unknown>): Promise<void> {
  const value = payload.value;
  if (!isRecord(value)) {
    await WhatsappWebhookEventRepository.markFailed(eventId);
    logger.error("whatsapp-webhook-handler: unusable event payload; terminally failed", { eventId, field });
    return;
  }
  const wabaId = toSafeString(payload.wabaId) ?? "";
  await dispatchChange(field, value, wabaId, new Map());
}

/** Log a rejected promise from Promise.allSettled, ignoring fulfilled ones. */
function logRejectedResult(result: PromiseSettledResult<unknown>, description: string): void {
  if (result.status === "rejected") {
    logger.error(`whatsapp-webhook-handler: ${description}`, {
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
    });
  }
}

/** Collect per-entry change-processing promises (in-memory path only). */
function collectEntryChanges(
  entry: WebhookEntryType | undefined,
  changePromises: Promise<void>[],
  recipientUserIdCache: Map<string, string | null>
): void {
  if (!entry?.changes || !Array.isArray(entry.changes)) {
    return;
  }
  for (const change of entry.changes) {
    changePromises.push(processChange(entry.id ?? "", change, recipientUserIdCache));
  }
}

/**
 * In-memory per-change dispatch: errors are logged and swallowed so one bad
 * change cannot stop the rest of the batch (the durable path retries rows
 * individually instead).
 */
async function processChange(
  wabaId: string,
  change: WebhookChangeType,
  recipientUserIdCache: Map<string, string | null>
): Promise<void> {
  const field = change.field ?? "";
  const value = change.value;
  if (!field || !isRecord(value)) {
    return;
  }
  try {
    await dispatchChange(field, value, wabaId, recipientUserIdCache);
  } catch (error) {
    logger.error("whatsapp-webhook-handler: error processing change", {
      field,
      wabaId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Shared field dispatch for both the in-memory path and the durable worker.
 * Throws on failures that must keep the durable row retryable (it stays
 * PROCESSING until the sweeper's backoff re-claim); the in-memory path
 * catches them per change.
 */
async function dispatchChange(
  field: string,
  value: Record<string, unknown>,
  wabaId: string,
  recipientUserIdCache: Map<string, string | null>
): Promise<void> {
  switch (field) {
    case "messages":
      await handleMessagesField(value, wabaId, recipientUserIdCache);
      break;
    case "history":
      await dispatchAccountBoundField(value, wabaId, "history");
      break;
    case "smb_app_state_sync":
      await dispatchAccountBoundField(value, wabaId, "smb_app_state_sync");
      break;
    case "smb_message_echoes":
      await dispatchAccountBoundField(value, wabaId, "smb_message_echoes");
      break;
    case "message_template_status_update":
    case "template_category_update":
    case "message_template_quality_update":
    case "message_template_components_update":
      await handleTemplateLifecycle(value, wabaId, field);
      break;
    case "phone_number_quality_update":
      await handleQualityUpdate(value, wabaId);
      break;
    case "business_capability_update":
      await handleCapabilityUpdate(value, wabaId);
      break;
    case "account_update":
      await handleAccountUpdate(value, wabaId);
      break;
    default:
      logger.debug("whatsapp-webhook-handler: unhandled field", { field });
  }
}

/**
 * Field handlers that must resolve the owning account via
 * `metadata.phone_number_id` before writing inbox state. An unresolvable
 * account is a hard throw so the durable row is retried (the account row may
 * not exist yet during onboarding) and parked at the attempt ceiling.
 */
async function dispatchAccountBoundField(value: Record<string, unknown>, wabaId: string, field: string): Promise<void> {
  const account = await resolveAccountByPhoneNumberId(value, wabaId);
  if (!account) {
    throw new Error(`whatsapp-webhook-handler: no account for ${field} change`);
  }
  if (field === "history") {
    await ingestHistoryValue(account, value);
  } else if (field === "smb_app_state_sync") {
    await ingestStateSyncValue(account, value);
  } else {
    await ingestEchoesValue(account, value);
  }
}

/**
 * `messages` field: delivery status updates (existing notification-delivery
 * path) plus genuine inbound user messages, which now persist into the inbox
 * (`whatsapp_conversations` / `whatsapp_messages`) instead of being stripped.
 */
async function handleMessagesField(
  value: Record<string, unknown>,
  wabaId: string,
  recipientUserIdCache: Map<string, string | null>
): Promise<void> {
  if (Array.isArray(value.statuses)) {
    await handleMessagesStatus(value, recipientUserIdCache);
  }
  if (Array.isArray(value.messages) && value.messages.length > 0) {
    const account = await resolveAccountByPhoneNumberId(value, wabaId);
    if (!account) {
      throw new Error("whatsapp-webhook-handler: no account for inbound messages change");
    }
    await ingestInboundMessages(account, value);
  }
}

// ─── Status transitions (delivery path: forward-only rank guard lives in repo) ─

/** Map Meta webhook status string → NotificationDeliveryStatus enum. */
function mapStatus(metaStatus: string): NotificationDeliveryStatus | null {
  switch (metaStatus) {
    case "accepted":
      return NotificationDeliveryStatus.PENDING;
    case "sent":
      return NotificationDeliveryStatus.SENT;
    case "delivered":
      return NotificationDeliveryStatus.DELIVERED;
    case "read":
      return NotificationDeliveryStatus.OPENED;
    case "failed":
      return NotificationDeliveryStatus.FAILED;
    default:
      return null;
  }
}

/** Type guard: validates a webhook entry shape. */
function isWebhookEntry(value: unknown): value is WebhookEntryType {
  if (!isRecord(value)) {
    return false;
  }
  if (value.id !== undefined && typeof value.id !== "string") {
    return false;
  }
  return value.changes === undefined || Array.isArray(value.changes);
}

/** Type guard: validates a status update has required `id` and `status` fields. */
function isStatusUpdate(value: unknown): value is StatusUpdate {
  return isRecord(value) && typeof value.id === "string" && typeof value.status === "string";
}

/** Type guard: is the value a valid NotificationEventType enum member? */
function isNotificationEventType(value: unknown): value is NotificationEventType {
  return typeof value === "string" && (Object.values(NotificationEventType) as readonly string[]).includes(value);
}

async function handleMessagesStatus(
  value: Record<string, unknown>,
  recipientUserIdCache: Map<string, string | null>
): Promise<void> {
  const rawStatuses = value.statuses;
  if (!rawStatuses || !Array.isArray(rawStatuses)) {
    return;
  }
  const statuses = rawStatuses.filter(isStatusUpdate);
  const eventTypeMap = await batchResolveEventTypes(statuses);
  const results = await Promise.allSettled(
    statuses.map(s => processStatusUpdate(s, recipientUserIdCache, eventTypeMap))
  );
  for (const result of results) {
    logRejectedResult(result, "status update failed");
  }
}

/** Mask a phone-number-like recipientId for logging — show only last 4 digits. */
function maskRecipientId(recipientId: string | undefined | null): string {
  if (!recipientId) {
    return "null";
  }
  if (recipientId.length <= 4) {
    return "****";
  }
  return `****${recipientId.slice(-4)}`;
}

async function resolveRecipientUserId(
  recipientId: string | undefined,
  wamid: string,
  cache: Map<string, string | null>
): Promise<string | undefined> {
  if (!recipientId) return undefined;
  if (cache.has(recipientId)) {
    return cache.get(recipientId) ?? undefined;
  }
  try {
    const user = await UserRepository.findByPhone(recipientId);
    cache.set(recipientId, user?.id ?? null);
    return user?.id;
  } catch {
    logger.warn("whatsapp-webhook-handler: user lookup by phone failed (not cached, will retry)", {
      wamid,
      recipientId: maskRecipientId(recipientId),
    });
    return undefined;
  }
}

/**
 * Resolve event types for all statuses in one query. Wamids without an
 * existing delivery row are ABSENT from the map — those are pure inbound /
 * coexistence-echo statuses that must not fabricate a CLASS_REMINDER
 * delivery analytics row.
 *
 * A lookup failure (transient DB error) is NOT collapsed into an empty map:
 * that would silently skip every status and — on the durable path — mark the
 * event PROCESSED, losing the statuses. The error propagates instead so the
 * in-memory path logs it per change and the durable worker keeps the event
 * claimable for retry.
 */
async function batchResolveEventTypes(statuses: StatusUpdate[]): Promise<Map<string, NotificationEventType>> {
  const wamids = statuses.map(s => s.id).filter(wamid => typeof wamid === "string" && isValidWamid(wamid));
  if (wamids.length === 0) {
    return new Map();
  }
  const deliveries = await NotificationRepository.getDeliveriesByProviderMessageIds(wamids);
  const result = new Map<string, NotificationEventType>();
  for (const wamid of wamids) {
    const existing = deliveries.get(wamid);
    if (existing?.eventType && isNotificationEventType(existing.eventType)) {
      result.set(wamid, existing.eventType);
    }
  }
  return result;
}

async function processStatusUpdate(
  statusUpdate: StatusUpdate,
  recipientUserIdCache: Map<string, string | null>,
  eventTypeMap: Map<string, NotificationEventType>
): Promise<void> {
  const { id: wamid, status: metaStatus, recipient_id: recipientId } = statusUpdate;
  if (!wamid || !metaStatus) {
    return;
  }
  if (!isValidWamid(wamid)) {
    logger.warn("whatsapp-webhook-handler: invalid wamid format", { wamid: String(wamid).slice(0, 20) });
    return;
  }
  if (!isValidRecipientId(recipientId)) {
    logger.warn("whatsapp-webhook-handler: invalid recipientId format", {
      recipientId: String(recipientId).slice(0, 20),
    });
    return;
  }
  const mappedStatus = mapStatus(metaStatus);
  if (!mappedStatus) {
    logger.debug("whatsapp-webhook-handler: unknown status", { wamid, metaStatus });
    return;
  }

  // Statuses for wamids with no delivery row are pure inbound / echo
  // business-side lifecycle events: nothing to confirm in our delivery
  // tracking, so they are skipped instead of polluting delivery analytics
  // with a fabricated event type.
  const eventType = eventTypeMap.get(wamid);
  if (!eventType) {
    logger.debug("whatsapp-webhook-handler: no delivery row for wamid; status skipped", { wamid, metaStatus });
    return;
  }

  const rawFailureReason = statusUpdate.errors?.[0]?.message ?? null;
  const failureReason = typeof rawFailureReason === "string" ? sanitizeFailureReason(rawFailureReason) : null;
  const userId = await resolveRecipientUserId(recipientId, wamid, recipientUserIdCache);

  const result = await NotificationRepository.handleDeliveryWebhook({
    providerMessageId: wamid,
    status: mappedStatus,
    failureReason,
    webhookPayload: { status: metaStatus, timestamp: statusUpdate.timestamp },
    channel: NotificationChannel.WHATSAPP,
    userId,
    eventType,
  });

  if (result) {
    logger.info("whatsapp-webhook-handler: delivery status updated", { wamid, metaStatus, mappedStatus });
  } else {
    logger.info("whatsapp-webhook-handler: delivery status skipped (no existing delivery or rank guard rejected)", {
      wamid,
      metaStatus,
      mappedStatus,
    });
  }
}

/** Validate Meta recipient_id format (numeric or redacted placeholder, ≤32 chars). */
function isValidRecipientId(recipientId: unknown): boolean {
  if (recipientId === undefined) {
    return true;
  }
  return (
    typeof recipientId === "string" &&
    recipientId.length <= 32 &&
    (/^\d+$/.test(recipientId) || recipientId === "[PHONE_REDACTED]")
  );
}

// ─── Template lifecycle events → audit log only ─────────────────────────────

async function handleTemplateLifecycle(
  value: Record<string, unknown>,
  wabaId: string,
  webhookField: string
): Promise<void> {
  const event = value as TemplateEvent;
  if (!event.message_template_id) {
    return;
  }
  const auditInput: CreateAuditLogInput = {
    actorType: "SYSTEM",
    entityType: "WHATSAPP_ACCOUNT",
    entityId: wabaId,
    action: "STATUS_CHANGE",
    description: `Template ${event.message_template_name ?? event.message_template_id} → ${event.event ?? webhookField}`,
    metadata: {
      templateId: event.message_template_id,
      templateName: event.message_template_name ?? null,
      templateLanguage: event.message_template_language ?? null,
      event: event.event ?? webhookField,
      reason: event.reason ?? null,
      webhookField,
      category: event.category ?? null,
    },
  };
  try {
    await AuditService.createManyAuditLogs([auditInput]);
    logger.info("whatsapp-webhook-handler: template lifecycle audit logged", {
      templateId: event.message_template_id,
      webhookField,
      event: event.event,
    });
  } catch (error) {
    logger.error("whatsapp-webhook-handler: template audit failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// ─── phone_number_quality_update & business_capability_update ───────────────

function parseMaxPhoneNumbers(maxPhones: unknown): string | null {
  if (typeof maxPhones === "number" && Number.isFinite(maxPhones)) {
    return String(Math.trunc(maxPhones));
  }
  if (typeof maxPhones === "string") {
    const trimmed = maxPhones.trim();
    if (trimmed.length > 0 && /^\d+$/.test(trimmed)) {
      return trimmed;
    }
  }
  return null;
}

/** Meta sends tier values BOTH as TIER_* strings and as bare integers. */
const TIER_STRINGS = new Set([
  "UNTIERED",
  "TIER_50",
  "TIER_250",
  "TIER_1K",
  "TIER_10K",
  "TIER_100K",
  "TIER_2K",
  "TIER_UNLIMITED",
]);
const TIER_BY_INT: Record<number, string> = {
  50: "TIER_50",
  250: "TIER_250",
  1000: "TIER_1K",
  2000: "TIER_2K",
  10000: "TIER_10K",
  100000: "TIER_100K",
};

/**
 * Tolerant tier parse: accepts TIER_* strings, numeric-string tiers, and
 * integer daily-conversation counts (messaging-limits docs shape). Returns
 * null for anything unrecognizable — the caller leaves the column untouched.
 */
function parseLimitTier(raw: unknown): string | null {
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (TIER_STRINGS.has(trimmed)) {
      return trimmed;
    }
    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? (TIER_BY_INT[numeric] ?? null) : null;
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return TIER_BY_INT[Math.trunc(raw)] ?? null;
  }
  return null;
}

function applyMaxDailyUpdate(
  value: Record<string, unknown>,
  update: WhatsappAccountUpdateInput,
  changes: Record<string, unknown>
): void {
  // v24.0+ webhooks: portfolio-level cap (TIER_* string OR integer).
  const current = parseLimitTier(value.max_daily_conversations_per_business);
  if (current) {
    update.portfolioMessagingLimitTier = current;
    changes.portfolioMessagingLimitTier = current;
    return;
  }
  if (value.max_daily_conversations_per_business != null) {
    logger.warn("whatsapp-webhook-handler: unrecognized portfolioMessagingLimitTier value, skipping");
  }
  // Legacy webhooks (<v24.0) only send the deprecated per-phone field.
  const legacy = parseLimitTier(value.max_daily_conversation_per_phone);
  if (legacy) {
    update.portfolioMessagingLimitTier = legacy;
    changes.portfolioMessagingLimitTier = legacy;
  }
}

function buildPhoneNumberUpdate(
  value: Record<string, unknown>,
  fieldMapping: { throughput?: boolean; maxDaily?: boolean; quality?: boolean }
): { update: WhatsappAccountUpdateInput; changes: Record<string, unknown> } {
  const update: WhatsappAccountUpdateInput = { lastWebhookAt: new Date() };
  const changes: Record<string, unknown> = {};

  if (fieldMapping.throughput && typeof value.throughput_level === "string" && value.throughput_level) {
    update.throughputLevel = value.throughput_level;
    changes.throughputLevel = update.throughputLevel;
  }
  if (fieldMapping.maxDaily) {
    applyMaxDailyUpdate(value, update, changes);
  }
  if (fieldMapping.quality && typeof value.quality_rating === "string" && value.quality_rating) {
    const coerced = coerceQualityRating(value.quality_rating);
    if (coerced) {
      update.qualityRating = coerced;
      changes.qualityRating = coerced;
    }
  }
  // Number caps are conditionally included (absence ≠ no cap). Only parse when present.
  const maxPhones = value.max_phone_numbers_per_business ?? value.max_phone_numbers_per_waba;
  if (maxPhones != null) {
    const maxPhonesStr = parseMaxPhoneNumbers(maxPhones);
    if (maxPhonesStr !== null) {
      update.maxPhoneNumbersPerBusiness = maxPhonesStr;
      changes.maxPhoneNumbersPerBusiness = maxPhonesStr;
    } else {
      logger.warn("whatsapp-webhook-handler: unrecognized phone-number cap value, skipping");
    }
  }
  return { update, changes };
}

/** Lookup the account for a per-number webhook value, with WABA cross-check. */
async function lookupAccountForWebhook(
  value: Record<string, unknown>,
  description: string,
  webhookWabaId: string
): Promise<{ phoneNumberId: string; account: WhatsappAccountReturnType } | null> {
  const account = await resolveAccountByPhoneNumberId(value, webhookWabaId);
  if (!account) {
    logger.warn(`whatsapp-webhook-handler: account not found for ${description}`);
    return null;
  }
  const phoneNumberId =
    (isRecord(value.metadata) ? toSafeString(value.metadata.phone_number_id) : undefined) ??
    toSafeString(value.phone_number_id);
  return { phoneNumberId: phoneNumberId ?? "", account };
}

async function applyPhoneNumberUpdate(
  value: Record<string, unknown>,
  description: string,
  fieldMapping: { throughput?: boolean; maxDaily?: boolean; quality?: boolean },
  webhookWabaId: string
): Promise<void> {
  const resolved = await lookupAccountForWebhook(value, description, webhookWabaId);
  if (!resolved) {
    return;
  }
  const { phoneNumberId, account } = resolved;
  const { update, changes } = buildPhoneNumberUpdate(value, fieldMapping);
  const auditInput: CreateAuditLogInput = {
    actorType: "SYSTEM",
    entityType: "WHATSAPP_ACCOUNT",
    entityId: account.id,
    action: "UPDATE",
    description,
    changes: { ...changes, maxPhoneNumbersPerBusiness: value.max_phone_numbers_per_business ?? null },
  };
  await Promise.all([
    WhatsappAccountService.systemUpdateAccount(account.id, update),
    AuditService.createManyAuditLogs([auditInput]).catch(err => {
      logger.error("whatsapp-webhook-handler: failed to write audit log", {
        error: err instanceof Error ? err.message : String(err),
      });
    }),
  ]);
  logger.info(`whatsapp-webhook-handler: ${description} applied`, { phoneNumberId });
}

async function handleQualityUpdate(value: Record<string, unknown>, wabaId: string): Promise<void> {
  await applyPhoneNumberUpdate(value, "phone_number_quality_update", { maxDaily: true, quality: true }, wabaId);
}

async function handleCapabilityUpdate(value: Record<string, unknown>, wabaId: string): Promise<void> {
  await applyPhoneNumberUpdate(value, "business_capability_update", { throughput: true, maxDaily: true }, wabaId);
}

// ─── account_update lifecycle ────────────────────────────────────────────────

/** Extract the PARTNER_REMOVED disconnection reason (null when unlisted). */
function parseDisconnectionReason(value: Record<string, unknown>): string | null {
  const info = isRecord(value.disconnection_info) ? value.disconnection_info : null;
  const reason = info ? toSafeString(info.reason) : undefined;
  return reason && PARTNER_DISCONNECTION_REASONS.has(reason) ? reason : null;
}

/** Extract the WABA ban state for DISABLED_UPDATE. */
function parseBanState(value: Record<string, unknown>): string | null {
  const info = isRecord(value.ban_info) ? value.ban_info : null;
  return info ? (toSafeString(info.waba_ban_state) ?? null) : null;
}

/** ACCOUNT_OFFBOARDED: deactivate + stamp + fail sync + evict the adapter. */
async function applyAccountOffboarded(account: WhatsappAccountReturnType): Promise<void> {
  await WhatsappAccountRepository.markOffboarded(account.id, new Date());
  if (account.syncStatus !== WhatsappSyncStatus.COMPLETE) {
    await WhatsappAccountRepository.markSyncFailed(account.id, WHATSAPP_SYNC_FAILURE_ACCOUNT_OFFBOARDED);
  }
  await resetWhatsappChannel(account.id);
  logger.warn("whatsapp-webhook-handler: account offboarded by Meta — Cloud API sends suspended until reconnect");
}

/** ACCOUNT_RECONNECTED: reactivate + clear marker; adapter re-instantiates lazily. */
async function applyAccountReconnected(account: WhatsappAccountReturnType): Promise<void> {
  await WhatsappAccountRepository.clearOffboarded(account.id);
  await resetWhatsappChannel(account.id);
  logger.warn("whatsapp-webhook-handler: account reconnected — companion devices need manual re-linking");
}

/** PARTNER_APP_UNINSTALLED / PARTNER_REMOVED: keep history, deactivate + evict. */
async function applyAccountDeactivated(account: WhatsappAccountReturnType, event: string): Promise<void> {
  await WhatsappAccountService.systemUpdateAccount(account.id, { isActive: false });
  await resetWhatsappChannel(account.id);
  logger.warn("whatsapp-webhook-handler: partner relationship ended — account deactivated", { event });
}

/** Persist the lifecycle audit row (failures are logged, not rethrown). */
async function writeLifecycleAudit(
  account: WhatsappAccountReturnType,
  event: string,
  value: Record<string, unknown>,
  disconnectionReason: string | null
): Promise<void> {
  const banState = parseBanState(value);
  const verified = typeof value.verified === "boolean" ? value.verified : undefined;
  const auditInput: CreateAuditLogInput = {
    actorType: "SYSTEM",
    entityType: "WHATSAPP_ACCOUNT",
    entityId: account.id,
    action: "STATUS_CHANGE",
    description: `account_update → ${event}`,
    metadata: {
      event,
      verified: verified ?? null,
      disconnectionReason,
      banState,
      phoneNumberHint: toSafeString(value.phone_number)?.slice(-4) ?? null,
    },
  };
  try {
    await AuditService.createManyAuditLogs([auditInput]);
  } catch (error) {
    logger.error("whatsapp-webhook-handler: lifecycle audit failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * `account_update` lifecycle dispatcher. Lifecycle payloads are WABA-scoped
 * (`phone_number`/`waba_id`, no `phone_number_id`), so resolution goes
 * through WABA + display-number disambiguation. Every recognized event writes
 * an audit row; dangerous transitions also flip account state and evict the
 * per-account adapter so subsequent sends fail fast before touching Meta.
 */
async function handleAccountUpdate(value: Record<string, unknown>, wabaId: string): Promise<void> {
  const account = await resolveLifecycleAccount(value, wabaId);
  if (!account) {
    return;
  }
  const event = toSafeString(value.event) ?? "UNKNOWN";
  await WhatsappAccountService.systemUpdateAccount(account.id, { lastWebhookAt: new Date() });

  switch (event) {
    case "ACCOUNT_OFFBOARDED":
      await applyAccountOffboarded(account);
      break;
    case "ACCOUNT_RECONNECTED":
      await applyAccountReconnected(account);
      break;
    case "PARTNER_APP_UNINSTALLED":
    case "PARTNER_REMOVED":
      await applyAccountDeactivated(account, event);
      break;
    default:
      break;
  }
  await writeLifecycleAudit(account, event, value, parseDisconnectionReason(value));
}

// ─── Durable worker helpers ─────────────────────────────────────────────────

/** Process one claimed batch: dispatch → markProcessed, or keep PROCESSING on error. */
async function drainClaimedEvents(
  events: { id: string; field: string; payload: Record<string, unknown>; attempts: number }[]
): Promise<{ processed: number; failed: number }> {
  // Rows are independent (unique wamid/LWW upserts inside dispatch) — parallelize.
  const outcomes = await Promise.all(
    events.map(async event => {
      try {
        await dispatchEventRow(event.id, event.field, event.payload);
        await WhatsappWebhookEventRepository.markProcessed(event.id);
        return true;
      } catch (error) {
        logger.error("whatsapp-webhook-handler: event dispatch failed; stays PROCESSING for sweep re-claim", {
          eventId: event.id,
          field: event.field,
          attempts: event.attempts,
          error: error instanceof Error ? error.message : String(error),
        });
        return false;
      }
    })
  );
  return {
    processed: outcomes.filter(Boolean).length,
    failed: outcomes.filter(outcome => !outcome).length,
  };
}

interface SweepTallies {
  claimed: number;
  processed: number;
  failed: number;
}

/**
 * Recursive sweep: claim up to SWEEP_CLAIM_LIMIT eligible rows per round,
 * drain them, and continue while a full batch was claimed. Bounded at
 * SWEEP_MAX_ROUNDS so one tick cannot monopolize the worker.
 */
async function drainSweepRounds(round: number, tallies: SweepTallies): Promise<SweepTallies> {
  if (round >= SWEEP_MAX_ROUNDS) {
    return tallies;
  }
  const batch = await WhatsappWebhookEventRepository.claimBatchWithBackoff(SWEEP_CLAIM_LIMIT, SWEEP_BACKOFF_BASE_MS);
  if (batch.length === 0) {
    return tallies;
  }
  const { processed, failed } = await drainClaimedEvents(batch);
  const next = {
    claimed: tallies.claimed + batch.length,
    processed: tallies.processed + processed,
    failed: tallies.failed + failed,
  };
  if (batch.length < SWEEP_CLAIM_LIMIT) {
    return next;
  }
  return drainSweepRounds(round + 1, next);
}
