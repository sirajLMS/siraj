import { coerceQualityRating } from "@/backend/lib";
import { logger } from "@/backend/lib/logger";
import { AuditService } from "@/backend/services/system/audit.service";
import { WhatsappAccountService } from "@/backend/services/whatsapp/whatsapp-account.service";
import {
  isRecord,
  resolveAccountByPhoneNumberId,
  toSafeString,
} from "@/backend/services/whatsapp/whatsapp-webhook-ingest.helpers";
import type {
  CreateAuditLogInput,
  WebhookTemplateEventType as TemplateEvent,
  WhatsappAccountReturnType,
  WhatsappAccountUpdateInput,
} from "@/backend/types";

/**
 * Phone-number / business-capability webhook projections for the WhatsApp
 * webhook handler: template lifecycle auditing plus the
 * `phone_number_quality_update` and `business_capability_update` fields, which
 * map Meta tiers, quality ratings, and number caps onto the account row.
 *
 * Payloads are untrusted parsed JSON (guard-narrowed, never logged with
 * content); failures log ids and counts only.
 */

export async function handleTemplateLifecycle(
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

export async function handleQualityUpdate(value: Record<string, unknown>, wabaId: string): Promise<void> {
  await applyPhoneNumberUpdate(value, "phone_number_quality_update", { maxDaily: true, quality: true }, wabaId);
}

export async function handleCapabilityUpdate(value: Record<string, unknown>, wabaId: string): Promise<void> {
  await applyPhoneNumberUpdate(value, "business_capability_update", { throughput: true, maxDaily: true }, wabaId);
}
