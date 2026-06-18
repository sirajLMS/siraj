import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { SchedulingRepository } from "@/backend/db/repo/scheduling.repository";
import { SystemSettingsRepository } from "@/backend/db/repo/system-settings.repository";
import { parents, teachers } from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AppPermission } from "@/shared/lib/enum";

export namespace ScheduleService {
  async function resolveViewerTimezone(userId: string): Promise<string> {
    const [teacher] = await db
      .select({ tz: teachers.timezone })
      .from(teachers)
      .where(eq(teachers.userId, userId))
      .limit(1);
    if (teacher?.tz) return teacher.tz;

    const [parent] = await db.select({ tz: parents.timezone }).from(parents).where(eq(parents.userId, userId)).limit(1);
    if (parent?.tz) return parent.tz;

    return await SystemSettingsRepository.getStringValue("default_timezone", "UTC");
  }

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

  export async function getDailySchedule(
    userId: string,
    targetDate: Date,
    teacherId?: string,
    search?: string,
    locale?: string
  ) {
    try {
      const isAuthorized = await PermissionsService.hasPermission(userId, AppPermission.SCHEDULE_VIEW_LIST);
      if (!isAuthorized) {
        logger.error("Unauthorized access to daily schedule", { userId });
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(t("unauthorizedViewList"));
      }

      if (search) {
        const canSearch = await PermissionsService.hasPermission(userId, AppPermission.DASHBOARD_SEARCH);
        if (!canSearch) {
          logger.error("Unauthorized search access to daily schedule", { userId });
          const t = await getBackendTranslations({ locale, namespace: "errors" });
          throw new Error(t("unauthorizedSearch"));
        }
      }

      const viewerTimezone = await resolveViewerTimezone(userId);

      const list = await SchedulingRepository.getDailySchedule(targetDate, {
        teacherId,
        search,
        viewerTimezone,
      });

      return list.map(item => ({ ...item }));
    } catch (error) {
      logger.error("Error fetching daily schedule", { userId, error });
      throw error;
    }
  }
}
