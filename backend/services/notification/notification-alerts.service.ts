import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { NotificationRepository } from "@/backend/db/repo";
import { complaints, notificationDeliveries } from "@/backend/db/schema";
import { AppPermission, ComplaintStatus, NotificationDeliveryStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  MarkableDeliveryRow,
  NotificationAlertReturnType,
  NotificationAlertsPaginatedReturnType,
  RecentNotificationRow,
  UnansweredComplaintRow,
} from "@/backend/types";
import type { NotificationMetadata } from "@/backend/types/notifications/notification-alerts.metadata.types";
import { getServerTranslations } from "@/shared/locale";

const COMPLAINT_ALERT_BODY_LIMIT = 100;
const ALERTS_PAGE_SIZE = 20;
const ALERTS_FEED_ID_PREFIX = "notification-alerts-";

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
    .limit(ALERTS_PAGE_SIZE) as Promise<RecentNotificationRow[]>;
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
  return rows as MarkableDeliveryRow[];
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
    metadata: notification.metadata as NotificationMetadata | null,
    title: notification.title ?? defaultTitle,
    body: notification.body,
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

export namespace NotificationAlertsService {
  export async function getAlerts(userId: string, locale?: string): Promise<NotificationAlertsPaginatedReturnType> {
    try {
      const canViewAlerts = await PermissionsService.hasPermission(userId, AppPermission.NOTIFICATION_VIEW_ALERTS);
      if (!canViewAlerts) {
        return emptyAlertsResult(userId);
      }

      const tNotifications = getServerTranslations(locale ?? "en").dashboardTranslations.coreNotifications;

      const canListComplaints = await PermissionsService.hasPermission(userId, AppPermission.COMPLAINTS_LIST);
      const unansweredComplaints = canListComplaints ? await fetchUnansweredComplaintRows() : [];

      const recentNotifications = await fetchRecentNotificationRows(userId);

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
    } catch (error) {
      logger.error("Error fetching notification alerts", { userId, error });
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
  export async function markAlertsRead(actorUserId: string, locale?: string): Promise<{ updatedCount: number }> {
    try {
      const canViewAlerts = await PermissionsService.hasPermission(actorUserId, AppPermission.NOTIFICATION_VIEW_ALERTS);
      if (!canViewAlerts) {
        raiseUnauthorizedAction(locale);
      }

      const recentNotifications = await fetchMarkableDeliveryRows(actorUserId);
      const candidates = recentNotifications.filter(n => n.status !== NotificationDeliveryStatus.OPENED);

      let updatedCount = 0;
      for (const candidate of candidates) {
        try {
          await NotificationRepository.recordDeliveryOpened(candidate.id, undefined, undefined, locale);
          updatedCount++;
        } catch (error) {
          logger.warn("markAlertsRead: failed to mark delivery OPENED", {
            deliveryId: candidate.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      return { updatedCount };
    } catch (error) {
      logger.error("Error marking notification alerts as read", { userId: actorUserId, error });
      throw error;
    }
  }

  export async function markOneAlertRead(actorUserId: string, deliveryId: string, locale?: string): Promise<void> {
    try {
      const canViewAlerts = await PermissionsService.hasPermission(actorUserId, AppPermission.NOTIFICATION_VIEW_ALERTS);
      if (!canViewAlerts) {
        raiseUnauthorizedAction(locale);
      }

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
      logger.error("Error marking notification alert as read", { userId: actorUserId, deliveryId, error });
      throw error;
    }
  }
}
