import { logger } from "@/backend/lib/logger";
import { handleAccountUpdate } from "@/backend/services/whatsapp/whatsapp-webhook-account.helpers";
import {
  handleGroupLifecycleField,
  handleGroupParticipantsField,
  handleGroupSettingsField,
  handleGroupStatusField,
  ingestGroupInboundMessage,
} from "@/backend/services/whatsapp/whatsapp-webhook-groups.helpers";
import {
  ingestEchoesValue,
  ingestHistoryValue,
  ingestInboundMessages,
  ingestStateSyncValue,
} from "@/backend/services/whatsapp/whatsapp-webhook-inbox.helpers";
import { isRecord, resolveAccountByPhoneNumberId } from "@/backend/services/whatsapp/whatsapp-webhook-ingest.helpers";
import {
  handleCapabilityUpdate,
  handleQualityUpdate,
  handleTemplateLifecycle,
} from "@/backend/services/whatsapp/whatsapp-webhook-limits.helpers";
import { handleMessagesStatus } from "@/backend/services/whatsapp/whatsapp-webhook-status.helpers";
import type { WebhookChangeType, WebhookEntryType } from "@/backend/types";

/**
 * Field dispatch for the WhatsApp webhook handler: the in-memory per-change
 * path and the shared field router used by both that path and the durable
 * worker. Payloads are untrusted parsed JSON (guard-narrowed, never logged
 * with content); failures log ids and counts only.
 */

/** Type guard: validates a webhook entry shape. */
export function isWebhookEntry(value: unknown): value is WebhookEntryType {
  if (!isRecord(value)) {
    return false;
  }
  if (value.id !== undefined && typeof value.id !== "string") {
    return false;
  }
  return value.changes === undefined || Array.isArray(value.changes);
}

/** Collect per-entry change-processing promises (in-memory path only). */
export function collectEntryChanges(
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
export async function dispatchChange(
  field: string,
  value: Record<string, unknown>,
  wabaId: string,
  recipientUserIdCache: Map<string, string | null>
): Promise<void> {
  switch (field) {
    case "messages":
      await handleMessagesField(value, wabaId, recipientUserIdCache);
      break;
    case "group_lifecycle_update":
      await handleGroupLifecycleField(value, wabaId);
      break;
    case "group_participants_update":
      await handleGroupParticipantsField(value, wabaId);
      break;
    case "group_settings_update":
      await handleGroupSettingsField(value, wabaId);
      break;
    case "group_status_update":
      await handleGroupStatusField(value, wabaId);
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
    // Inbound records carrying group_id are group-thread messages — they go
    // to the group message table and must never create 1:1 conversations.
    const direct = value.messages.filter(
      message => !(isRecord(message) && typeof message.group_id === "string" && message.group_id.length > 0)
    );
    const groupMessages = value.messages.filter(
      message => isRecord(message) && typeof message.group_id === "string" && message.group_id.length > 0
    );
    await Promise.all(groupMessages.map(message => ingestGroupInboundMessage(account, message)));
    if (direct.length > 0) {
      await ingestInboundMessages(account, { ...value, messages: direct });
    }
  }
}
