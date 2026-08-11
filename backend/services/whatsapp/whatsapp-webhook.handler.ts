import { NotificationRepository } from "@/backend/db/repo/notifications/notification.repository";
import { UserRepository } from "@/backend/db/repo/users/user.repository";
import { NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { sanitizeFailureReason } from "@/backend/lib/whatsapp-sanitize";
import { AuditService } from "@/backend/services/system/audit.service";
import { WhatsappAccountService } from "@/backend/services/whatsapp";
import type { CreateAuditLogInput } from "@/backend/types/audit/audit.types";
import type {
  WhatsappAccountReturnType,
  WhatsappAccountUpdateInput,
} from "@/backend/types/whatsapp/whatsapp-account.types";
import { coerceLimitTier, coerceQualityRating } from "@/backend/types/whatsapp/whatsapp-account.types";
import type {
  WebhookStatusUpdateType as StatusUpdate,
  WebhookTemplateEventType as TemplateEvent,
  WebhookChangeType,
  WebhookEntryType,
} from "@/backend/types/whatsapp/whatsapp-webhook.types";

/**
 * WhatsApp webhook handler — processes inbound webhook events from Meta Cloud API.
 *
 * Security:
 *  S3 — Inbound `value.messages[]` is stripped at the route level; handler defensively drops if encountered.
 *
 * Requirements:
 *  R1/R2 — Status transitions update notification_deliveries.
 *  R6    — Template lifecycle events → audit log only.
 *  B3    — Forward-only rank guard is enforced inside handleDeliveryWebhook (repo layer).
 *  P3    — Upsert by providerMessageId === wamid (safe when webhook outruns adapter's row insert).
 *  Q5    — portfolioMessagingLimitTier coerced via coerceLimitTier (matches syncFromMeta).
 */

/** Map Meta webhook status string → NotificationDeliveryStatus enum. */
function mapStatus(metaStatus: string): NotificationDeliveryStatus | null {
  switch (metaStatus) {
    case "accepted":
      // Meta "accepted" = queued/acknowledged by provider, maps to PENDING
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

// ─── Handler ───────────────────────────────────────────────────────────────────

export const WhatsappWebhookHandler = {
  /**
   * Process a verified webhook event.
   * The `messages[]` array has already been stripped from every change entry (S3).
   */
  async processEvent(webhookBody: unknown): Promise<void> {
    if (!isRecord(webhookBody)) {
      logger.warn("whatsapp-webhook-handler: no entry array");
      return;
    }
    const rawEntry = webhookBody.entry;
    if (!rawEntry || !Array.isArray(rawEntry)) {
      logger.warn("whatsapp-webhook-handler: no entry array");
      return;
    }

    // Request-scoped cache of recipientId → userId to avoid N UserRepository.findByPhone
    // lookups when a webhook payload delivers many statuses sharing the same recipientId.
    // Local to this call so concurrent webhook payloads don't share/clobber entries.
    const recipientUserIdCache = new Map<string, string | null>();

    // Collect all change-processing promises across all entries so they run in parallel.
    // Each change is processed independently — one failure does not stop others (r7-005).
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
};

// ─── Handler ───────────────────────────────────────────────────────────────────

/** Log a rejected promise from Promise.allSettled, ignoring fulfilled ones. */
function logRejectedResult(result: PromiseSettledResult<unknown>, description: string): void {
  if (result.status === "rejected") {
    logger.error(`whatsapp-webhook-handler: ${description}`, {
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
    });
  }
}

/** Collect per-entry change-processing promises (S3: strips inbound messages defensively). */
function collectEntryChanges(
  entry: WebhookEntryType | undefined,
  changePromises: Promise<void>[],
  recipientUserIdCache: Map<string, string | null>
): void {
  if (!entry?.changes || !Array.isArray(entry.changes)) {
    return;
  }
  for (const change of entry.changes) {
    if (change.value && Array.isArray(change.value.messages)) {
      const safeValue = { ...change.value };
      delete safeValue.messages;
      changePromises.push(processChange(entry.id ?? "", { ...change, value: safeValue }, recipientUserIdCache));
    } else {
      changePromises.push(processChange(entry.id ?? "", change, recipientUserIdCache));
    }
  }
}

async function processChange(
  wabaId: string,
  change: WebhookChangeType,
  recipientUserIdCache: Map<string, string | null>
): Promise<void> {
  const field = change.field;
  const value = change.value;

  if (!field || !value) {
    return;
  }

  try {
    switch (field) {
      case "messages":
        await handleMessagesStatus(value, recipientUserIdCache);
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
  } catch (error) {
    logger.error("whatsapp-webhook-handler: error processing change", {
      field,
      wabaId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// ─── 13.2 + 13.3: Status transitions (R1, R2, B3, P3) ─────────────────────────

/** Validate Meta wamid format (alphanumeric + underscore/dot/hyphen, ≤128 chars). Requires at least one alphanumeric character. */
function isValidWamid(wamid: unknown): wamid is string {
  return (
    typeof wamid === "string" && wamid.length >= 8 && wamid.length <= 128 && /^(?=.*[a-zA-Z0-9])[\w.-]+$/.test(wamid)
  );
}

/** Validate Meta phone_number_id format (numeric or redacted placeholder, ≤32 chars). Must be present and non-empty. */
function isValidPhoneNumberId(phoneNumberId: unknown): boolean {
  return (
    typeof phoneNumberId === "string" &&
    phoneNumberId.length > 0 &&
    phoneNumberId.length <= 32 &&
    (/^\d+$/.test(phoneNumberId) || phoneNumberId === "[PHONE_REDACTED]")
  );
}

/** Validate Meta recipient_id format (numeric or redacted placeholder, ≤32 chars). Undefined is valid (optional field). */
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

/** Type guard: narrows `unknown` to `Record<string, unknown>` for safe property access. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Type guard: validates a webhook entry has the expected `WebhookEntryType` shape. */
function isWebhookEntry(value: unknown): value is WebhookEntryType {
  if (!isRecord(value)) {
    return false;
  }
  if (value.id !== undefined && typeof value.id !== "string") {
    return false;
  }
  if (value.changes !== undefined && !Array.isArray(value.changes)) {
    return false;
  }
  return true;
}

/** Type guard: validates a status update has required `id` and `status` string fields. */
function isStatusUpdate(value: unknown): value is StatusUpdate {
  return isRecord(value) && typeof value.id === "string" && typeof value.status === "string";
}

/** Type guard: validates a string is a valid `NotificationEventType` enum value. */
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

  // Batch-resolve event types for all wamids in a single query to avoid N+1 lookups.
  const eventTypeMap = await batchResolveEventTypes(statuses);

  // Process all statuses in parallel so DB round-trips don't serialize (r7-004).
  // Each status is processed independently — one failure does not stop others.
  const results = await Promise.allSettled(
    statuses.map(s => processStatusUpdate(s, recipientUserIdCache, eventTypeMap))
  );
  for (const result of results) {
    logRejectedResult(result, "status update failed");
  }
}

/** Mask a phone-number-like recipientId for logging — show only last 4 digits (r6-sec-03). */
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
  if (!recipientId) {
    return undefined;
  }
  if (cache.has(recipientId)) {
    return cache.get(recipientId) ?? undefined;
  }
  try {
    const user = await UserRepository.findByPhone(recipientId);
    // Only cache on success — don't cache null on transient lookup errors (M11).
    cache.set(recipientId, user?.id ?? null);
    return user?.id;
  } catch {
    // Do NOT cache on error — let subsequent lookups retry (M11).
    logger.warn("whatsapp-webhook-handler: user lookup by phone failed (not cached, will retry)", {
      wamid,
      recipientId: maskRecipientId(recipientId),
    });
    return undefined;
  }
}

/**
 * Resolve event types for all statuses in a single batch query using IN clause.
 * Returns a Map of wamid → eventType, defaulting to CLASS_REMINDER for missing rows.
 *
 * On total DB failure, ALL status updates get eventType=CLASS_REMINDER (M10).
 * This pollutes analytics but is a graceful degradation — no UNKNOWN enum exists in
 * NotificationEventType. Logged at ERROR level to surface this limitation in monitoring.
 */
async function batchResolveEventTypes(statuses: StatusUpdate[]): Promise<Map<string, NotificationEventType>> {
  const wamids = statuses.map(s => s.id).filter(wamid => typeof wamid === "string" && isValidWamid(wamid));

  if (wamids.length === 0) {
    return new Map();
  }

  const result = new Map<string, NotificationEventType>();
  const unresolvedWamids: string[] = [];
  try {
    const deliveries = await NotificationRepository.getDeliveriesByProviderMessageIds(wamids);
    for (const wamid of wamids) {
      const existing = deliveries.get(wamid);
      if (existing?.eventType && isNotificationEventType(existing.eventType)) {
        result.set(wamid, existing.eventType);
      } else {
        unresolvedWamids.push(wamid);
        result.set(wamid, NotificationEventType.CLASS_REMINDER);
      }
    }
  } catch {
    // On total DB failure, all wamids fall back to CLASS_REMINDER (M10).
    // This is a known limitation — NotificationEventType has no UNKNOWN member,
    // so we degrade gracefully but log at ERROR to highlight analytics pollution risk.
    logger.error(
      "whatsapp-webhook-handler: batch event-type lookup failed — falling back to CLASS_REMINDER for all (analytics pollution risk)",
      {
        wamidCount: wamids.length,
      }
    );
    for (const wamid of wamids) {
      unresolvedWamids.push(wamid);
      result.set(wamid, NotificationEventType.CLASS_REMINDER);
    }
  }

  if (unresolvedWamids.length > 0) {
    logger.warn("whatsapp-webhook-handler: no existing delivery found — falling back to CLASS_REMINDER event type", {
      wamids: unresolvedWamids,
    });
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

  // P3: Upsert by providerMessageId === wamid.
  // B3: handleDeliveryWebhook enforces forward-only rank guard internally —
  // The adapter always sends the message back to us, so we can safely ignore it.
  const rawFailureReason = statusUpdate.errors?.[0]?.message ?? null;
  const failureReason = typeof rawFailureReason === "string" ? sanitizeFailureReason(rawFailureReason) : null;

  // Channel is always WhatsApp — pass it to enable the INSERT/upsert branch.
  const channel = NotificationChannel.WHATSAPP;

  // Best-effort lookup of recipient userId from the status payload.
  // The UPDATE path (existing row by providerMessageId) doesn't need userId —
  // only the INSERT path does. repo handles undefined userId by returning null
  // from INSERT but still processing the UPDATE for existing rows.
  const userId = await resolveRecipientUserId(recipientId, wamid, recipientUserIdCache);

  // r7-043: Event type resolved via batch lookup in handleMessagesStatus.
  // Falls back to CLASS_REMINDER if the delivery row doesn't exist yet.
  const eventType = eventTypeMap.get(wamid) ?? NotificationEventType.CLASS_REMINDER;

  const result = await NotificationRepository.handleDeliveryWebhook({
    providerMessageId: wamid,
    status: mappedStatus,
    failureReason,
    webhookPayload: { status: metaStatus, timestamp: statusUpdate.timestamp },
    channel,
    userId,
    eventType,
  });

  // B3: Check the return value to distinguish real updates from graceful skips.
  // - truthy: row was updated, inserted, or returned unchanged (same-status/rank guard)
  // - null: no existing delivery row AND missing required INSERT fields, OR the
  //   rank guard rejected the INSERT — graceful skip in either case
  if (result) {
    logger.info("whatsapp-webhook-handler: delivery status updated", {
      wamid,
      metaStatus,
      mappedStatus,
    });
  } else {
    logger.info("whatsapp-webhook-handler: delivery status skipped (no existing delivery or rank guard rejected)", {
      wamid,
      metaStatus,
      mappedStatus,
    });
  }
}

// ─── 13.4: Template lifecycle events → audit log only (R6) ──────────────────

async function handleTemplateLifecycle(
  value: Record<string, unknown>,
  wabaId: string,
  webhookField: string
): Promise<void> {
  const event = value as TemplateEvent;
  if (!event.message_template_id) {
    return;
  }

  // REQ-5.5: All four template lifecycle events are handled:
  //   message_template_status_update — APPROVED, REJECTED, PENDING, PAUSED
  //   template_category_update — category change
  //   message_template_quality_update — quality rating change
  //   message_template_components_update — component structure change
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

// ─── 13.5 + 13.6: phone_number_quality_update & business_capability_update ──

/**
 * Shared helper for phone-number-scoped webhook updates (Q5).
 * Looks up the account by phone number ID, applies the mapped fields,
 * updates the DB via the service layer, and logs an audit entry.
 */
/**
 * Build the update payload and audit changes object from webhook `value` fields.
 * Extracted from `applyPhoneNumberUpdate` to reduce cognitive complexity.
 */

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

function applyMaxDailyUpdate(
  value: Record<string, unknown>,
  update: WhatsappAccountUpdateInput,
  changes: Record<string, unknown>
) {
  if (typeof value.max_daily_conversations_per_business === "string" && value.max_daily_conversations_per_business) {
    const coerced = coerceLimitTier(value.max_daily_conversations_per_business);
    if (coerced) {
      update.portfolioMessagingLimitTier = coerced;
      changes.portfolioMessagingLimitTier = coerced;
    } else {
      logger.warn("whatsapp-webhook-handler: unrecognized portfolioMessagingLimitTier value, skipping", {
        rawValue: value.max_daily_conversations_per_business,
      });
    }
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

  const maxPhones = value.max_phone_numbers_per_business;
  if (maxPhones !== undefined && maxPhones !== null) {
    const maxPhonesStr = parseMaxPhoneNumbers(maxPhones);
    if (maxPhonesStr !== null) {
      update.maxPhoneNumbersPerBusiness = maxPhonesStr;
      changes.maxPhoneNumbersPerBusiness = maxPhonesStr;
    } else {
      logger.warn("whatsapp-webhook-handler: invalid max_phone_numbers_per_business value, skipping", {
        rawValue: maxPhones,
      });
    }
  }

  return { update, changes };
}

async function lookupAccountForWebhook(
  value: Record<string, unknown>,
  description: string,
  webhookWabaId: string
): Promise<{ phoneNumberId: string; account: WhatsappAccountReturnType } | null> {
  const phoneNumberId = typeof value.phone_number_id === "string" ? value.phone_number_id : undefined;
  if (!phoneNumberId || !isValidPhoneNumberId(phoneNumberId)) {
    return null;
  }

  const account = await WhatsappAccountService.systemFindByPhoneNumberId(phoneNumberId);
  if (!account) {
    logger.warn(`whatsapp-webhook-handler: account not found for ${description}`, { phoneNumberId });
    return null;
  }

  // r10-013: Verify that the webhook entry's WABA ID matches the stored account's wabaId.
  if (webhookWabaId && account.wabaId && webhookWabaId !== account.wabaId) {
    logger.error("Webhook phone_number_id WABA mismatch, skipping update", {
      phoneNumberId,
      webhookWabaId,
      storedWabaId: account.wabaId,
    });
    return null;
  }

  return { phoneNumberId, account };
}

async function applyPhoneNumberUpdate(
  value: Record<string, unknown>,
  description: string,
  fieldMapping: { throughput?: boolean; maxDaily?: boolean; quality?: boolean },
  webhookWabaId: string
): Promise<void> {
  const resolved = await lookupAccountForWebhook(value, description, webhookWabaId);
  if (!resolved) return;
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

  // r10-051: Run the audit log write in parallel with the account update.
  // The audit log is independent of the update result — it only needs the
  // pre-computed auditInput, not the update's return value.
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

/**
 * Handle `account_update` webhook — processes account verification state changes.
 * Meta sends `phone_number_id` and `verified` (boolean) for account-level updates.
 * Records the verification change in the audit log.
 */
async function handleAccountUpdate(value: Record<string, unknown>, wabaId: string): Promise<void> {
  const resolved = await lookupAccountForWebhook(value, "account_update", wabaId);
  if (!resolved) return;
  const { phoneNumberId, account } = resolved;

  // r10-052: This uses systemUpdateAccount (full service method with transaction)
  // for a simple lastWebhookAt heartbeat update. A simpler repo-level update would
  // avoid the transaction overhead, but is left as-is for simplicity since the
  // update is infrequent and the transaction cost is negligible.
  await WhatsappAccountService.systemUpdateAccount(account.id, { lastWebhookAt: new Date() });

  const verified = typeof value.verified === "boolean" ? value.verified : undefined;
  const auditInput: CreateAuditLogInput = {
    actorType: "SYSTEM",
    entityType: "WHATSAPP_ACCOUNT",
    entityId: account.id,
    action: "UPDATE",
    description: `account_update → verification ${verified ? "verified" : "unverified"}`,
    changes: { verified: verified ?? null },
  };

  try {
    await AuditService.createManyAuditLogs([auditInput]);
  } catch (err) {
    logger.error("whatsapp-webhook-handler: failed to write audit log", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  logger.info("whatsapp-webhook-handler: account_update applied", { phoneNumberId, verified });
}
