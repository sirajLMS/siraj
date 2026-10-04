import { NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  NotificationAlertReturnType,
  NotificationAlertsPaginatedReturnType,
  NotificationMetadata,
  RecentNotificationRow,
  UnansweredComplaintRow,
  UserPermissionContext,
} from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

const COMPLAINT_ALERT_BODY_LIMIT = 100;

const ALERTS_FEED_ID_PREFIX = "notification-alerts-";

/**
 * Per-channel fan-out of one notification dispatch shares the same event,
 * target entity, and creation timestamp within seconds; deliveries from the
 * same dispatch are grouped when they fall into the same minute bucket.
 */
export const DELIVERY_GROUP_WINDOW_MS = 60_000;

/**
 * Channels whose delivery row stores the recipient address in `body` instead
 * of message copy (ResendEmailAdapter persists `payload.to`, TwilioSmsAdapter
 * the phone number). These rows are delivery bookkeeping, never user-facing
 * notification content.
 */
const ADDRESS_BODY_CHANNELS: ReadonlySet<string> = new Set<string>([
  NotificationChannel.EMAIL,
  NotificationChannel.SMS,
]);

const NOTIFICATION_ENTITY_KINDS: ReadonlySet<string> = new Set([
  "invoice",
  "class",
  "student",
  "complaint",
  "suggestion",
  "paymentMethod",
  "schedule",
  "lessonReport",
]);

const NOTIFICATION_DELIVERY_STATUSES: ReadonlySet<string> = new Set(Object.values(NotificationDeliveryStatus));
const NOTIFICATION_EVENT_TYPES: ReadonlySet<string> = new Set(Object.values(NotificationEventType));
const NOTIFICATION_CHANNELS: ReadonlySet<string> = new Set(Object.values(NotificationChannel));

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isNotificationDeliveryStatus(value: string): value is NotificationDeliveryStatus {
  return NOTIFICATION_DELIVERY_STATUSES.has(value);
}

export function isNotificationEventType(value: string): value is NotificationEventType {
  return NOTIFICATION_EVENT_TYPES.has(value);
}

export function isNotificationChannel(value: string): value is NotificationChannel {
  return NOTIFICATION_CHANNELS.has(value);
}

export function isNotificationMetadata(value: unknown): value is NotificationMetadata {
  if (!isPlainObject(value)) return false;
  const { entityKind, entityId } = value;
  return typeof entityKind === "string" && typeof entityId === "string" && NOTIFICATION_ENTITY_KINDS.has(entityKind);
}

export function emptyAlertsResult(userId: string): NotificationAlertsPaginatedReturnType {
  return {
    id: `${ALERTS_FEED_ID_PREFIX}${userId}`,
    alerts: [],
    totalCount: 0,
    unreadCount: 0,
  };
}

export function raiseUnauthorizedAction(locale?: string): never {
  const t = getServerTranslations(locale ?? "en").errorsTranslations;
  throw new Error(t.unauthorizedAction);
}

/**
 * Suppresses the recipient-address placeholder stored as the delivery `body`
 * for email/SMS rows so the drawer never renders a raw address as notification
 * content. Real message bodies (ON_APP, push, WhatsApp) pass through.
 */
export function resolveNotificationAlertBody(channel: NotificationChannel, body: string | null): string | null {
  return ADDRESS_BODY_CHANNELS.has(channel) ? null : body;
}

export function buildComplaintAlert(complaint: UnansweredComplaintRow, title: string): NotificationAlertReturnType {
  return {
    id: `complaint-${complaint.id}`,
    deliveryId: null,
    type: "complaint",
    eventType: null,
    channel: null,
    metadata: { entityKind: "complaint", entityId: complaint.id },
    title,
    body:
      complaint.body.length > COMPLAINT_ALERT_BODY_LIMIT
        ? `${complaint.body.substring(0, COMPLAINT_ALERT_BODY_LIMIT)}...`
        : complaint.body,
    createdAt: complaint.createdAt,
    severity: "warning",
    readAt: null,
  };
}

export function buildNotificationAlert(
  notification: RecentNotificationRow,
  defaultTitle: string
): NotificationAlertReturnType {
  return {
    id: `notification-${notification.id}`,
    deliveryId: notification.id,
    type: "notification",
    eventType: notification.eventType,
    channel: notification.channel,
    metadata: isNotificationMetadata(notification.metadata) ? notification.metadata : null,
    title: notification.title ?? defaultTitle,
    body: resolveNotificationAlertBody(notification.channel, notification.body),
    createdAt: notification.createdAt,
    severity: notification.status === NotificationDeliveryStatus.FAILED ? "error" : "info",
    readAt: notification.openedAt ?? null,
  };
}

export function buildAlertsFeed(
  userId: string,
  alerts: NotificationAlertReturnType[],
  unreadCount: number
): NotificationAlertsPaginatedReturnType {
  return {
    id: `${ALERTS_FEED_ID_PREFIX}${userId}`,
    alerts,
    totalCount: alerts.length,
    unreadCount,
  };
}

/**
 * Runtime discriminator: returns `true` when the second argument is a
 * `UserPermissionContext` (not `undefined` / not a `string`). This lets the
 * overloaded methods branch between the context-aware fast path and the
 * legacy `PermissionsService.hasPermission(userId, ...)` path without changing
 * the original call sites.
 */
export function isPermissionContext(value: unknown): value is UserPermissionContext {
  return typeof value === "object" && value !== null && "permissions" in value && "isSuperAdmin" in value;
}

/**
 * Extracts the permission context from a discriminated `contextOrLocale` /
 * `contextOrDeliveryId` argument. When the argument is a `UserPermissionContext`,
 * returns it directly (fast path — no DB round-trip). When absent, fetches the
 * context via `PermissionsService.getUserContext(userId)` (legacy path).
 *
 * Collapses the triplicated `WithCtx` / `Legacy` / discriminator boilerplate
 * that was previously repeated across `getAlerts`, `markAlertsRead`, and
 * `markOneAlertRead`.
 */
export async function resolvePermissionContext(
  userId: string,
  contextOrLocale: unknown
): Promise<UserPermissionContext> {
  if (isPermissionContext(contextOrLocale)) {
    return contextOrLocale;
  }
  return await PermissionsService.getUserContext(userId);
}
