import { TeacherRepository } from "@/backend/db/repo/teachers/teacher.repository";
import { AppPermission } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { PageInfo, PaginationArgs, TeacherDirectoryMetrics, TeacherDirectoryRow } from "@/backend/types";
import { PaginationUtils } from "@/backend/utils/pagination.utils";
import { getServerTranslations } from "@/shared/locale";

export namespace StaffDirectoryService {
  async function assertDirectoryAccess(userId: string, locale?: string): Promise<void> {
    const isAuthorized = await PermissionsService.hasAnyPermission(userId, [
      AppPermission.TEACHERS_LIST,
      AppPermission.STAFF_VIEW_DIRECTORY,
    ]);
    if (!isAuthorized) {
      const t = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(t.unauthorizedAction);
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
          status: row.status,
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
