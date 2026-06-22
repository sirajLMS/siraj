import { StudentRepository } from "@/backend/db/repo/student.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { PaginationArgs, StudentFilterArgs, StudentsOrderByClause } from "@/backend/types";
import { AppPermission } from "@/shared/lib/enum";

export namespace StudentDirectoryService {
  /**
   * Fetches enriched student directory rows with cross-relational data
   * (parent name, teacher name, hours-per-week).
   * Requires `students.list` permission.
   */
  export async function getStudentDirectory(
    actorUserId: string,
    paginationArgs: PaginationArgs | null,
    filters?: StudentFilterArgs | null,
    orderBy?: StudentsOrderByClause[] | null,
    locale?: string
  ): Promise<StudentRepository.StudentDirectoryResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.STUDENTS_LIST);
    if (!hasPermission) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
    }

    return await StudentRepository.getDirectoryRows(paginationArgs, filters, orderBy);
  }
}
