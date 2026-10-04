import { NotificationRepository } from "@/backend/db/repo/notifications/notification.repository";
import { UserRepository } from "@/backend/db/repo/users/user.repository";
import { NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { sanitizeFailureReason } from "@/backend/lib/whatsapp-sanitize";
import {
  ingestGroupMessageStatuses,
  isGroupStatusUpdate,
} from "@/backend/services/whatsapp/whatsapp-webhook-groups.helpers";
import { isRecord, isValidWamid } from "@/backend/services/whatsapp/whatsapp-webhook-ingest.helpers";
import type { WebhookStatusUpdateType as StatusUpdate } from "@/backend/types";

/**
 * Delivery-status projections for the WhatsApp webhook handler: the
 * notification-delivery confirmation path (`sent`/`delivered`/`read`/
 * `failed`) plus group-addressed statuses, which rewrite the group message
 * table and never touch notification analytics.
 *
 * Payloads are untrusted parsed JSON (guard-narrowed, never logged with
 * content); failures log ids and counts only.
 */

/** Log a rejected promise from Promise.allSettled, ignoring fulfilled ones. */
export function logRejectedResult(result: PromiseSettledResult<unknown>, description: string): void {
  if (result.status === "rejected") {
    logger.error(`whatsapp-webhook-handler: ${description}`, {
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
    });
  }
}

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

/** Type guard: validates a status update has required `id` and `status` fields. */
function isStatusUpdate(value: unknown): value is StatusUpdate {
  return isRecord(value) && typeof value.id === "string" && typeof value.status === "string";
}

/** Type guard: is the value a valid NotificationEventType enum member? */
function isNotificationEventType(value: unknown): value is NotificationEventType {
  return typeof value === "string" && (Object.values(NotificationEventType) as readonly string[]).includes(value);
}

export async function handleMessagesStatus(
  value: Record<string, unknown>,
  recipientUserIdCache: Map<string, string | null>
): Promise<void> {
  const rawStatuses = value.statuses;
  if (!rawStatuses || !Array.isArray(rawStatuses)) {
    return;
  }
  // Group-addressed statuses rewrite the group message table's own status
  // column; they never touch the notification-delivery analytics path.
  const groupStatuses = rawStatuses.filter(isGroupStatusUpdate);
  if (groupStatuses.length > 0) {
    await ingestGroupMessageStatuses(groupStatuses);
  }
  const statuses = rawStatuses.filter(status => !isGroupStatusUpdate(status) && isStatusUpdate(status));
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
