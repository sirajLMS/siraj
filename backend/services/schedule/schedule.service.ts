import { SchedulingRepository } from "@/backend/db/repo/scheduling.repository";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";

export namespace ScheduleService {
  export async function getDailyMetrics(userId: string, targetDate: Date, teacherId?: string) {
    try {
      const isAuthorized = await PermissionsService.hasPermission(userId, "dashboard.view_metrics");
      if (!isAuthorized) {
        logger.error("Unauthorized access to daily metrics", { userId });
        throw new Error("Unauthorized: Missing dashboard.view_metrics permission");
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

  export async function getDailySchedule(userId: string, targetDate: Date, teacherId?: string) {
    try {
      const isAuthorized = await PermissionsService.hasPermission(userId, "schedule.view_list");
      if (!isAuthorized) {
        logger.error("Unauthorized access to daily schedule", { userId });
        throw new Error("Unauthorized: Missing schedule.view_list permission");
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
