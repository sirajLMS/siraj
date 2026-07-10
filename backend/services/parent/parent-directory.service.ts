import { ParentRepository } from "@/backend/db/repo";
import { AccountStatus, AppPermission, ParentStatus } from "@/backend/enum";
import { parseAccountStatus, parseParentStatus } from "@/backend/lib/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { PaginationArgs, ParentDirectoryResult, ParentDirectoryRow } from "@/backend/types";

export type {
  ParentDirectoryMetrics,
  ParentDirectoryResult,
  ParentDirectoryRow,
} from "@/backend/types";

export namespace ParentDirectoryService {
  /**
   * Retrieves the parent directory with metrics and rows.
   * Requires: parent.view_directory permission.
   */
  export async function getParentDirectory(
    actorUserId: string,
    search: string | null,
    pagination: PaginationArgs | null,
    lifecycleStatus: ParentStatus | null,
    locale?: string
  ): Promise<ParentDirectoryResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.PARENT_VIEW_DIRECTORY);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const {
      metrics,
      rows: rawRows,
      totalCount,
      pageInfo,
    } = await ParentRepository.getParentDirectory({ search, pagination, lifecycleStatus });

    const parentIds = rawRows.map(r => r.id);
    const studentsMap = await ParentRepository.getStudentsForParents(parentIds);

    const rows: ParentDirectoryRow[] = [];
    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const students = studentsMap.get(row.id) ?? [];
      const guardianOf = students.map(s => s.name).join(", ") || "No students";

      rows.push({
        id: row.id,
        userId: row.userId,
        index: (pagination?.offset ?? 0) + i + 1,
        name: row.name,
        email: row.email,
        avatarUrl: row.avatarUrl,
        guardianOf,
        time: row.updatedAt.toLocaleTimeString(),
        lifecycleStatus: parseParentStatus(row.lifecycleStatus) ?? ParentStatus.REGULAR,
        accountStatus: parseAccountStatus(row.accountStatus),
        unpaidInvoices: row.unpaidInvoices,
      });
    }

    return {
      id: "parent-directory",
      metrics: {
        id: "parent-metrics",
        ...metrics,
      },
      rows,
      totalCount,
      pageInfo,
    };
  }
}
