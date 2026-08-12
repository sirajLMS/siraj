import { StudentRepository } from "@/backend/db/repo/students";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services";
import type { PaginationArgs, StudentDirectoryResult, StudentFilterArgs, StudentsOrderByClause } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export namespace StudentDirectoryService {
  /**
   * Fetches enriched student directory rows with cross-relational data
   * (parent name, teacher name, hours-per-week).
   * Requires `students.list` permission.
   */
  export async function getStudentDirectory(
    actorUserId: string,
    paginationArgs: PaginationArgs | null,
    tErrors: ErrorsLabels,
    filters?: StudentFilterArgs | null,
    orderBy?: StudentsOrderByClause[] | null
  ): Promise<StudentDirectoryResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.STUDENTS_LIST);
    if (!hasPermission) {
      throw new Error(tErrors.insufficientPermissions);
    }

    return await StudentRepository.getDirectoryRows(paginationArgs, filters, orderBy);
  }
}
