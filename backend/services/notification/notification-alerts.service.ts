import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { NotificationRepository } from "@/backend/db/repo";
import { complaints, notificationDeliveries } from "@/backend/db/schema";
import { AppPermission, ComplaintStatus, NotificationDeliveryStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { NotificationAlertReturnType, NotificationAlertsPaginatedReturnType } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

export namespace NotificationAlertsService {
  export async function getAlerts(userId: string, locale?: string): Promise<NotificationAlertsPaginatedReturnType> {
    try {
      const canViewAlerts = await PermissionsService.hasPermission(userId, AppPermission.NOTIFICATION_VIEW_ALERTS);
      if (!canViewAlerts) {
        const t = getServerTranslations(locale ?? "en").errorsTranslations;
        throw new Error(t.unauthorizedAction);
      }

      const tNotifications = getServerTranslations(locale ?? "en").dashboardTranslations.coreNotifications;

      const unansweredComplaints = await db
        .select({
          id: complaints.id,
          body: complaints.body,
          createdAt: complaints.createdAt,
        })
        .from(complaints)
        .where(and(eq(complaints.status, ComplaintStatus.UNANSWERED), isNull(complaints.deletedAt)))
        .orderBy(desc(complaints.createdAt))
        .limit(20);

      const recentNotifications = await db
        .select({
          id: notificationDeliveries.id,
          title: notificationDeliveries.title,
          body: notificationDeliveries.body,
          createdAt: notificationDeliveries.createdAt,
          status: notificationDeliveries.status,
        })
        .from(notificationDeliveries)
        .where(eq(notificationDeliveries.userId, userId))
        .orderBy(desc(notificationDeliveries.createdAt))
        .limit(20);

      const alerts: NotificationAlertReturnType[] = [];

      for (const complaint of unansweredComplaints) {
        alerts.push({
          id: `complaint-${complaint.id}`,
          type: "complaint",
          title: tNotifications.newUnansweredComplaint,
          body: complaint.body.length > 100 ? `${complaint.body.substring(0, 100)}...` : complaint.body,
          createdAt: complaint.createdAt,
          severity: "warning",
        });
      }

      for (const notification of recentNotifications) {
        alerts.push({
          id: `notification-${notification.id}`,
          type: "notification",
          title: notification.title ?? tNotifications.defaultSystemNotification,
          body: notification.body,
          createdAt: notification.createdAt,
          severity: notification.status === NotificationDeliveryStatus.FAILED ? "error" : "info",
        });
      }

      alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const unreadCount = recentNotifications.filter(n => n.status !== NotificationDeliveryStatus.OPENED).length;

      return {
        id: `notification-alerts-${userId}`,
        alerts,
        totalCount: alerts.length,
        unreadCount,
      };
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
        const t = getServerTranslations(locale ?? "en").errorsTranslations;
        throw new Error(t.unauthorizedAction);
      }

      const recentNotifications = await db
        .select({
          id: notificationDeliveries.id,
          status: notificationDeliveries.status,
        })
        .from(notificationDeliveries)
        .where(eq(notificationDeliveries.userId, actorUserId))
        .orderBy(desc(notificationDeliveries.createdAt))
        .limit(20);

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
}
