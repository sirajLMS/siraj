import { and, eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { NotificationRepository } from "@/backend/db/repo/notifications";
import { notificationDeliveries } from "@/backend/db/schema";
import { AppPermission, NotificationChannel, NotificationDeliveryStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import {
  buildAlertsFeed,
  buildComplaintAlert,
  buildNotificationAlert,
  DELIVERY_GROUP_WINDOW_MS,
  emptyAlertsResult,
  isNotificationMetadata,
  isPermissionContext,
  raiseUnauthorizedAction,
  resolvePermissionContext,
} from "@/backend/services/notification/notification-alerts.helpers";
import {
  fetchMarkableDeliveryRows,
  fetchRecentNotificationRows,
  fetchUnansweredComplaintRows,
} from "@/backend/services/notification/notification-alerts.queries";
import type {
  NotificationAlertReturnType,
  NotificationAlertsPaginatedReturnType,
  RecentNotificationRow,
  UserPermissionContext,
} from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

export { resolveNotificationAlertBody } from "@/backend/services/notification/notification-alerts.helpers";

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
   * refresh its alert feed regardless.
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

      let updatedCount = 0;
      for (const result of markResults) {
        if (result.success) {
          updatedCount++;
          continue;
        }
        logger.warn("markAlertsRead: failed to mark delivery OPENED", {
          deliveryId: result.candidate.id,
          error: result.error instanceof Error ? result.error.message : String(result.error),
        });
      }

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
