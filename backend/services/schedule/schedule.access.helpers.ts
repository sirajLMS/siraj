import { AppPermission } from "@/backend/enum";
import { UnauthorizedError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { ErrorsLabels } from "@/shared/locale";

export async function assertDailyScheduleListAccess(
  userId: string,
  options: { search?: string; metricFilter?: string },
  tErrors: ErrorsLabels
) {
  const isAuthorized = await PermissionsService.hasAnyPermission(userId, [
    AppPermission.SCHEDULE_VIEW_LIST,
    AppPermission.SCHEDULE_VIEW_ALL,
  ]);
  if (!isAuthorized) {
    logger.warn("Unauthorized access to daily schedule", { userId });
    throw new UnauthorizedError(tErrors.unauthorizedViewList);
  }

  if (options.search) {
    const canSearch = await PermissionsService.hasPermission(userId, AppPermission.DASHBOARD_SEARCH);
    if (!canSearch) {
      logger.warn("Unauthorized search access to daily schedule", { userId });
      throw new UnauthorizedError(tErrors.unauthorizedSearch);
    }
  }

  if (options.metricFilter && options.metricFilter !== "total") {
    const canFilter = await PermissionsService.hasPermission(userId, AppPermission.DASHBOARD_FILTER_METRICS);
    if (!canFilter) {
      logger.warn("Unauthorized metric filter access to daily schedule", {
        userId,
        metricFilter: options.metricFilter,
      });
      throw new UnauthorizedError(tErrors.unauthorizedAction);
    }
  }
}
