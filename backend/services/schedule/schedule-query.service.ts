import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import type { StatusTrackingRow } from "@/backend/db/repo/scheduling/queries";
import { AppPermission } from "@/backend/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";

/**
 * ScheduleQueryService — thin service layer for schedule-related read queries.
 *
 * This service gates access to scheduling data behind permission checks.
 * Currently supports the Status Tracking dashboard (admin view).
 *
 * Permission requirements:
 * - getStatusTrackingSchedule: requires SCHEDULE_VIEW_ALL OR DASHBOARD_VIEW_METRICS
 *   (either permission grants access — Admin and Super Admin hold these)
 *
 * Architecture note:
 * - This service does NOT import from Drizzle or DB schema directly.
 * - All data access goes through SchedulingRepository.
 * - Called exclusively by Pothos resolvers in schedule.pothos.ts.
 */
export namespace ScheduleQueryService {
  /**
   * Fetches class instances for the status tracking dashboard.
   *
   * Returns all class instances scheduled on the given date, enriched with
   * student status and isFrozen flag. Results are ordered by scheduledStartAt.
   *
   * @param actorUserId - The ID of the requesting user (must hold SCHEDULE_VIEW_ALL or DASHBOARD_VIEW_METRICS)
   * @param date - The date to fetch classes for (day boundaries computed from viewerTimezone)
   * @param options - Optional search filter and timezone
   * @param locale - Optional locale for i18n error messages
   * @returns Array of StatusTrackingRow objects
   */
  export async function getStatusTrackingSchedule(
    actorUserId: string,
    date: Date,
    options?: { search?: string; viewerTimezone?: string },
    locale?: string
  ): Promise<StatusTrackingRow[]> {
    const hasPermission = await PermissionsService.hasAnyPermission(actorUserId, [
      AppPermission.SCHEDULE_VIEW_ALL,
      AppPermission.DASHBOARD_VIEW_METRICS,
    ]);

    if (!hasPermission) {
      logger.warn("Unauthorized access to status tracking schedule", { userId: actorUserId });
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
    }

    return SchedulingRepository.getStatusTrackingRows(date, options);
  }
}
