import { TeacherRepository } from "@/backend/db/repo/teacher.repository";
import { type AccountStatus, AppPermission } from "@/backend/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { PageInfo, PaginationArgs, TeacherDirectoryMetrics, TeacherDirectoryRow } from "@/backend/types";
import { PaginationUtils } from "@/backend/utils/pagination.utils";

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
    paginationArgs: PaginationArgs | null,
    search?: string,
    locale?: string
  ): Promise<{
    id: string;
    metrics: TeacherDirectoryMetrics;
    rows: TeacherDirectoryRow[];
    totalTeachers: number;
    pageInfo: PageInfo | null;
  }> {
    try {
      await assertDirectoryAccess(userId, locale);

      const { rows: rawRows, totalCount } = await TeacherRepository.getTeacherDirectory(paginationArgs, search);
      const metrics = await TeacherRepository.getTeacherDirectoryMetrics();

      const pageInfo = PaginationUtils.buildPageInfoFromArgs(paginationArgs, rawRows.length, totalCount);

      return {
        id: `teacher-directory-${search ?? "all"}`,
        metrics,
        rows: rawRows.map(row => ({
          id: row.id,
          userId: row.userId,
          name: row.name,
          email: row.email,
          avatarUrl: row.avatarUrl,
          status: row.status as AccountStatus,
          zoomLink: row.zoomLink,
        })),
        totalTeachers: totalCount,
        pageInfo,
      };
    } catch (error) {
      logger.error("Error fetching teacher directory", { userId, error });
      throw error;
    }
  }
}
