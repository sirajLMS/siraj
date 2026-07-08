import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { complaints, notificationDeliveries } from "@/backend/db/schema";
import { AppPermission, ComplaintStatus, NotificationDeliveryStatus } from "@/backend/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { NotificationAlertReturnType, NotificationAlertsPaginatedReturnType } from "@/backend/types";

export namespace NotificationAlertsService {
  export async function getAlerts(userId: string, locale?: string): Promise<NotificationAlertsPaginatedReturnType> {
    try {
      const canViewAlerts = await PermissionsService.hasPermission(userId, AppPermission.NOTIFICATION_VIEW_ALERTS);
      if (!canViewAlerts) {
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(t("unauthorizedAction"));
      }

      const tNotifications = await getBackendTranslations({ locale, namespace: "dashboard.notifications" });

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
          title: tNotifications("newUnansweredComplaint"),
          body: complaint.body.length > 100 ? `${complaint.body.substring(0, 100)}...` : complaint.body,
          createdAt: complaint.createdAt,
          severity: "warning",
        });
      }

      for (const notification of recentNotifications) {
        alerts.push({
          id: `notification-${notification.id}`,
          type: "notification",
          title: notification.title ?? tNotifications("defaultSystemNotification"),
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
}
