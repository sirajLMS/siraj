import { TeacherRepository } from "@/backend/db/repo/teacher.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AppPermission } from "@/shared/lib/enum";

export namespace StaffDirectoryService {
  async function assertDirectoryAccess(userId: string, locale?: string): Promise<void> {
    const isAuthorized = await PermissionsService.hasPermission(userId, AppPermission.STAFF_VIEW_DIRECTORY);
    if (!isAuthorized) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
    }
  }

  export async function getDirectory(
    userId: string,
    options?: { search?: string; limit?: number; offset?: number },
    locale?: string
  ) {
    try {
      await assertDirectoryAccess(userId, locale);

      const rows = await TeacherRepository.getTeacherDirectory(options);
      const metrics = await TeacherRepository.getTeacherDirectoryMetrics();

      return {
        id: `teacher-directory-${options?.search ?? "all"}`,
        metrics: {
          id: "teacher-directory-metrics",
          activated: metrics.activated,
          deactivated: metrics.deactivated,
        },
        rows: rows.map((row, index) => ({
          id: row.id,
          index: String(index + 1).padStart(2, "0"),
          name: row.name,
          email: row.email,
          avatarUrl: row.avatarUrl ?? "",
          status: row.status === "ACTIVATED" ? "active" : "offline",
          zoomLink: row.zoomLink,
        })),
        totalTeachers: metrics.activated + metrics.deactivated,
      };
    } catch (error) {
      logger.error("Error fetching teacher directory", { userId, error });
      throw error;
    }
  }
}
