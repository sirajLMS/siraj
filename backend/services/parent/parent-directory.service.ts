import type { PaginationArgs } from "@/backend/types";
import { ParentRepository } from "@/backend/db/repo";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AppPermission } from "@/shared/lib/enum";

export interface ParentDirectoryMetrics {
  readonly id: string;
  readonly activated: number;
  readonly deactivated: number;
  readonly regular: number;
  readonly onLeave: number;
  readonly suspended: number;
  readonly onTrial: number;
}

export interface ParentDirectoryRow {
  readonly id: string;
  readonly index: number;
  readonly name: string;
  readonly email: string;
  readonly avatarUrl: string | null;
  readonly guardianOf: string;
  readonly time: string;
  readonly accountStatus: string;
  readonly unpaidInvoices: number;
}

export interface ParentDirectoryResult {
  readonly id: string;
  readonly metrics: ParentDirectoryMetrics;
  readonly rows: ParentDirectoryRow[];
  readonly totalCount: number;
  readonly pageInfo: import("@/backend/types").PageInfo | null;
}

export namespace ParentDirectoryService {
  /**
   * Retrieves the parent directory with metrics and rows.
   * Requires: parent.view_directory permission.
   */
  export async function getParentDirectory(
    actorUserId: string,
    search: string | null,
    pagination: PaginationArgs | null,
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
    } = await ParentRepository.getParentDirectory({ search, pagination });

    const rows: ParentDirectoryRow[] = [];
    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const students = await ParentRepository.getStudentsForParent(row.id);
      const guardianOf = students.map(s => s.name).join(", ") || "No students";

      rows.push({
        id: row.id,
        index: (pagination?.offset ?? 0) + i + 1,
        name: row.name,
        email: row.email,
        avatarUrl: row.avatarUrl,
        guardianOf,
        time: row.updatedAt.toLocaleTimeString(),
        accountStatus: row.status.toLowerCase(),
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
