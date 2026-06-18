import { SchedulingRepository } from "@/backend/db/repo/scheduling.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AppPermission } from "@/shared/lib/enum";

export namespace ScheduleService {
  export async function getDailyMetrics(userId: string, targetDate: Date, teacherId?: string, locale?: string) {
    try {
      const isAuthorized = await PermissionsService.hasPermission(userId, AppPermission.DASHBOARD_VIEW_METRICS);
      if (!isAuthorized) {
        logger.error("Unauthorized access to daily metrics", { userId });
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(t("unauthorizedViewMetrics"));
      }

      const metrics = await SchedulingRepository.getDailyMetrics(targetDate, teacherId);

      // Inject ID for Apollo Cache
      return {
        id: `metrics-${targetDate.toISOString()}-${teacherId || "all"}`,
        ...metrics,
      };
    } catch (error) {
      logger.error("Error fetching daily metrics", { userId, error });
      throw error;
    }
  }

  export async function getDailySchedule(userId: string, targetDate: Date, teacherId?: string, locale?: string) {
    try {
      const isAuthorized = await PermissionsService.hasPermission(userId, AppPermission.SCHEDULE_VIEW_LIST);
      if (!isAuthorized) {
        logger.error("Unauthorized access to daily schedule", { userId });
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(t("unauthorizedViewList"));
      }

      const list = await SchedulingRepository.getDailySchedule(targetDate, teacherId);

      // We will map it to the GraphQL object shape in the Pothos definitions
      return list;
    } catch (error) {
      logger.error("Error fetching daily schedule", { userId, error });
      throw error;
    }
  }
}
