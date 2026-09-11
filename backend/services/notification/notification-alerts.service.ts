import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { NotificationRepository } from "@/backend/db/repo/notifications";
import { complaints, notificationDeliveries } from "@/backend/db/schema";
import {
  AppPermission,
  ComplaintStatus,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationEventType,
} from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  MarkableDeliveryRow,
  NotificationAlertReturnType,
  NotificationAlertsPaginatedReturnType,
  NotificationMetadata,
  RecentNotificationRow,
  UnansweredComplaintRow,
  UserPermissionContext,
} from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

const COMPLAINT_ALERT_BODY_LIMIT = 100;
const ALERTS_PAGE_SIZE = 20;
const ALERTS_FEED_ID_PREFIX = "notification-alerts-";

/**
 * Per-channel fan-out of one notification dispatch shares the same event,
 * target entity, and creation timestamp within seconds; deliveries from the
 * same dispatch are grouped when they fall into the same minute bucket.
 */
const DELIVERY_GROUP_WINDOW_MS = 60_000;

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

function isNotificationDeliveryStatus(value: string): value is NotificationDeliveryStatus {
  return NOTIFICATION_DELIVERY_STATUSES.has(value);
}

function isNotificationEventType(value: string): value is NotificationEventType {
  return NOTIFICATION_EVENT_TYPES.has(value);
}

function isNotificationChannel(value: string): value is NotificationChannel {
  return NOTIFICATION_CHANNELS.has(value);
}

function isNotificationMetadata(value: unknown): value is NotificationMetadata {
  if (!isPlainObject(value)) return false;
  const { entityKind, entityId } = value;
  return typeof entityKind === "string" && typeof entityId === "string" && NOTIFICATION_ENTITY_KINDS.has(entityKind);
}

function emptyAlertsResult(userId: string): NotificationAlertsPaginatedReturnType {
  return {
    id: `${ALERTS_FEED_ID_PREFIX}${userId}`,
    alerts: [],
    totalCount: 0,
    unreadCount: 0,
  };
}

function raiseUnauthorizedAction(locale?: string): never {
  const t = getServerTranslations(locale ?? "en").errorsTranslations;
  throw new Error(t.unauthorizedAction);
}

function fetchUnansweredComplaintRows(): Promise<UnansweredComplaintRow[]> {
  return db
    .select({
      id: complaints.id,
      body: complaints.body,
      createdAt: complaints.createdAt,
    })
    .from(complaints)
    .where(and(eq(complaints.status, ComplaintStatus.UNANSWERED), isNull(complaints.deletedAt)))
    .orderBy(desc(complaints.createdAt))
    .limit(ALERTS_PAGE_SIZE);
}

function toRecentNotificationRow(row: {
  id: string;
  title: string | null;
  body: string | null;
  createdAt: Date;
  status: string;
  eventType: string;
  channel: string;
  metadata: NotificationMetadata | null;
  openedAt: Date | null;
}): RecentNotificationRow {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.createdAt,
    status: isNotificationDeliveryStatus(row.status) ? row.status : NotificationDeliveryStatus.PENDING,
    eventType: isNotificationEventType(row.eventType) ? row.eventType : NotificationEventType.CLASS_REMINDER,
    channel: isNotificationChannel(row.channel) ? row.channel : NotificationChannel.EMAIL,
    metadata: row.metadata,
    openedAt: row.openedAt,
  };
}

function fetchRecentNotificationRows(userId: string): Promise<RecentNotificationRow[]> {
  return db
    .select({
      id: notificationDeliveries.id,
      title: notificationDeliveries.title,
      body: notificationDeliveries.body,
      createdAt: notificationDeliveries.createdAt,
      status: notificationDeliveries.status,
      eventType: notificationDeliveries.eventType,
      channel: notificationDeliveries.channel,
      metadata: notificationDeliveries.metadata,
      openedAt: notificationDeliveries.openedAt,
    })
    .from(notificationDeliveries)
    .where(eq(notificationDeliveries.userId, userId))
    .orderBy(desc(notificationDeliveries.createdAt))
    .limit(ALERTS_PAGE_SIZE)
    .then(rows => rows.map(toRecentNotificationRow));
}

function toMarkableDeliveryRow(row: { id: string; status: string }): MarkableDeliveryRow {
  return {
    id: row.id,
    status: isNotificationDeliveryStatus(row.status) ? row.status : NotificationDeliveryStatus.PENDING,
  };
}

/**
 * The drawer surface renders one entry per logical notification, while the
 * `notification_deliveries` table stores one row per dispatched channel
 * (e.g. ON_APP + EMAIL for the same dispatch). Deliveries belonging to the
 * same dispatch share event type, target entity, and creation-minute bucket;
 * within a group the ON_APP row wins because it is the only channel whose
 * `title`/`body` carry the in-app message copy. Non-grouped rows pass through
 * unchanged, so an unmatched row degrades to the previous per-delivery row
 * instead of disappearing.
 */
export function groupRecentDeliveriesByNotification(rows: readonly RecentNotificationRow[]): RecentNotificationRow[] {
  const byGroup = new Map<string, RecentNotificationRow>();
  for (const row of rows) {
    const metadata = isNotificationMetadata(row.metadata) ? row.metadata : null;
    const bucket = Math.floor(row.createdAt.getTime() / DELIVERY_GROUP_WINDOW_MS);
    const key = `${row.eventType}|${metadata?.entityKind ?? ""}|${metadata?.entityId ?? ""}|${bucket}`;
    const existing = byGroup.get(key);
    const preferRow =
      !existing || (existing.channel !== NotificationChannel.ON_APP && row.channel === NotificationChannel.ON_APP);
    if (preferRow) {
      byGroup.set(key, row);
    }
  }
  return [...byGroup.values()];
}

/**
 * Suppresses the recipient-address placeholder stored as the delivery `body`
 * for email/SMS rows so the drawer never renders a raw address as notification
 * content. Real message bodies (ON_APP, push, WhatsApp) pass through.
 */
export function resolveNotificationAlertBody(channel: NotificationChannel, body: string | null): string | null {
  return ADDRESS_BODY_CHANNELS.has(channel) ? null : body;
}

async function fetchMarkableDeliveryRows(userId: string): Promise<MarkableDeliveryRow[]> {
  const rows = await db
    .select({
      id: notificationDeliveries.id,
      status: notificationDeliveries.status,
    })
    .from(notificationDeliveries)
    .where(eq(notificationDeliveries.userId, userId))
    .orderBy(desc(notificationDeliveries.createdAt))
    .limit(ALERTS_PAGE_SIZE);
  return rows.map(toMarkableDeliveryRow);
}

function buildComplaintAlert(complaint: UnansweredComplaintRow, title: string): NotificationAlertReturnType {
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

function buildNotificationAlert(
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

function buildAlertsFeed(
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

async function buildAlertsResult(
  userId: string,
  canListComplaints: boolean,
  tNotifications: { newUnansweredComplaint: string; defaultSystemNotification: string }
): Promise<NotificationAlertsPaginatedReturnType> {
  const unansweredComplaints = canListComplaints ? await fetchUnansweredComplaintRows() : [];

  const recentNotifications = groupRecentDeliveriesByNotification(await fetchRecentNotificationRows(userId));

  const alerts: NotificationAlertReturnType[] = [];
  for (const complaint of unansweredComplaints) {
    alerts.push(buildComplaintAlert(complaint, tNotifications.newUnansweredComplaint));
  }
  for (const notification of recentNotifications) {
    alerts.push(buildNotificationAlert(notification, tNotifications.defaultSystemNotification));
  }

  alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const unreadCount = recentNotifications.filter(n => n.status !== NotificationDeliveryStatus.OPENED).length;

  return buildAlertsFeed(userId, alerts, unreadCount);
}

/**
 * Runtime discriminator: returns `true` when the second argument is a
 * `UserPermissionContext` (not `undefined` / not a `string`). This lets the
 * overloaded methods branch between the context-aware fast path and the
 * legacy `PermissionsService.hasPermission(userId, ...)` path without changing
 * the original call sites.
 */
function isPermissionContext(value: unknown): value is UserPermissionContext {
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
async function resolvePermissionContext(userId: string, contextOrLocale: unknown): Promise<UserPermissionContext> {
  if (isPermissionContext(contextOrLocale)) {
    return contextOrLocale;
  }
  return await PermissionsService.getUserContext(userId);
}

export namespace NotificationAlertsService {
  export async function getAlerts(
    userId: string,
    context: UserPermissionContext,
    locale?: string
  ): Promise<NotificationAlertsPaginatedReturnType>;
  export async function getAlerts(userId: string, locale?: string): Promise<NotificationAlertsPaginatedReturnType>;
  export async function getAlerts(
    userId: string,
    contextOrLocale?: UserPermissionContext | string,
    locale?: string
  ): Promise<NotificationAlertsPaginatedReturnType> {
    try {
      const actualLocale = typeof contextOrLocale === "string" ? contextOrLocale : locale;
      const context = await resolvePermissionContext(userId, contextOrLocale);

      const canViewAlerts = await PermissionsService.hasPermission(context, AppPermission.NOTIFICATION_VIEW_ALERTS);
      if (!canViewAlerts) {
        return emptyAlertsResult(userId);
      }

      const canListComplaints = await PermissionsService.hasPermission(context, AppPermission.COMPLAINTS_LIST);
      return await buildAlertsResult(
        userId,
        canListComplaints,
        getServerTranslations(actualLocale ?? "en").dashboardTranslations.coreNotifications
      );
    } catch (error) {
      logger.error("Error fetching notification alerts", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Mark all of `actorUserId`'s notification deliveries as OPENED.
   *
   * Permission-gated by `AppPermission.NOTIFICATION_VIEW_ALERTS` — the
   * same permission that gates the dashboard notification panel. Rows
   * that are already in `OPENED` status are skipped by the repo's status
   * transition guard (`recordDeliveryOpened` -> `updateDeliveryStatus`).
   *
   * Per-row failures are caught and logged so a single delivery's failure
   * does NOT poison the batch; the mutation returns the count of rows
   * we attempted to mark (not the count that succeeded) so the caller can
   * refresh its alert feed regardless. We intentionally do not collapse
   * this to a single batch helper (which S8 doesn't own either) — see
   * specs.md ownership matrix: the repo is out-of-scope to edit here.
   */
  export async function markAlertsRead(
    actorUserId: string,
    context: UserPermissionContext,
    locale?: string
  ): Promise<{ updatedCount: number }>;
  export async function markAlertsRead(actorUserId: string, locale?: string): Promise<{ updatedCount: number }>;
  export async function markAlertsRead(
    actorUserId: string,
    contextOrLocale?: UserPermissionContext | string,
    locale?: string
  ): Promise<{ updatedCount: number }> {
    const actualLocale = typeof contextOrLocale === "string" ? contextOrLocale : locale;
    const context = await resolvePermissionContext(actorUserId, contextOrLocale);

    if (!(await PermissionsService.hasPermission(context, AppPermission.NOTIFICATION_VIEW_ALERTS))) {
      raiseUnauthorizedAction(actualLocale);
    }
    return await markAlertsReadExecute(actorUserId, actualLocale);
  }

  async function markAlertsReadExecute(actorUserId: string, locale?: string): Promise<{ updatedCount: number }> {
    try {
      const recentNotifications = await fetchMarkableDeliveryRows(actorUserId);
      const candidates = recentNotifications.filter(n => n.status !== NotificationDeliveryStatus.OPENED);

      const markResults = await Promise.all(
        candidates.map(async candidate => {
          try {
            await NotificationRepository.recordDeliveryOpened(candidate.id, undefined, undefined, locale);
            return { success: true as const, candidate };
          } catch (error) {
            return { success: false as const, candidate, error };
          }
        })
      );

      const updatedCount = markResults.reduce((count, result) => {
        if (result.success) {
          return count + 1;
        }
        logger.warn("markAlertsRead: failed to mark delivery OPENED", {
          deliveryId: result.candidate.id,
          error: result.error instanceof Error ? result.error.message : String(result.error),
        });
        return count;
      }, 0);

      return { updatedCount };
    } catch (error) {
      logger.error("Error marking notification alerts as read", {
        userId: actorUserId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  export async function markOneAlertRead(
    actorUserId: string,
    context: UserPermissionContext,
    deliveryId: string,
    locale?: string
  ): Promise<void>;
  export async function markOneAlertRead(actorUserId: string, deliveryId: string, locale?: string): Promise<void>;
  export async function markOneAlertRead(
    actorUserId: string,
    contextOrDeliveryId: UserPermissionContext | string,
    deliveryIdOrLocale?: string,
    locale?: string
  ): Promise<void> {
    const hasContext = isPermissionContext(contextOrDeliveryId);
    const deliveryId = hasContext ? (deliveryIdOrLocale ?? "") : contextOrDeliveryId;
    const actualLocale = hasContext ? locale : deliveryIdOrLocale;
    if (!deliveryId) {
      raiseUnauthorizedAction(actualLocale);
    }
    const context = await resolvePermissionContext(actorUserId, hasContext ? contextOrDeliveryId : undefined);
    if (!(await PermissionsService.hasPermission(context, AppPermission.NOTIFICATION_VIEW_ALERTS))) {
      raiseUnauthorizedAction(actualLocale);
    }
    return await markOneAlertReadExecute(actorUserId, deliveryId, actualLocale);
  }

  async function markOneAlertReadExecute(actorUserId: string, deliveryId: string, locale?: string): Promise<void> {
    try {
      const [delivery] = await db
        .select({ id: notificationDeliveries.id })
        .from(notificationDeliveries)
        .where(and(eq(notificationDeliveries.id, deliveryId), eq(notificationDeliveries.userId, actorUserId)))
        .limit(1);

      if (!delivery) {
        const t = getServerTranslations(locale ?? "en").errorsTranslations;
        throw new Error(t.notFound);
      }

      await NotificationRepository.recordDeliveryOpened(deliveryId, undefined, undefined, locale);
    } catch (error) {
      logger.error("Error marking notification alert as read", {
        userId: actorUserId,
        deliveryId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
