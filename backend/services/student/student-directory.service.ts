import { StudentRepository } from "@/backend/db/repo";
import { AppPermission } from "@/backend/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services";
import type { PaginationArgs, StudentDirectoryResult, StudentFilterArgs, StudentsOrderByClause } from "@/backend/types";

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
  ): Promise<StudentDirectoryResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.STUDENTS_LIST);
    if (!hasPermission) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
    }

    return await StudentRepository.getDirectoryRows(paginationArgs, filters, orderBy);
  }
}
