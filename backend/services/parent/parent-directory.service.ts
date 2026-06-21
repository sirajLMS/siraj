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
  readonly totalParents: number;
}

export namespace ParentDirectoryService {
  /**
   * Retrieves the parent directory with metrics and rows.
   * Requires: parent.view_directory permission.
   */
  export async function getParentDirectory(
    actorUserId: string,
    search: string | null,
    limit: number,
    offset: number,
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
      totalParents,
    } = await ParentRepository.getParentDirectory({ search, limit, offset });

    const rows: ParentDirectoryRow[] = [];
    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const students = await ParentRepository.getStudentsForParent(row.id);
      const guardianOf = students.map(s => s.name).join(", ") || "No students";

      rows.push({
        id: row.id,
        index: offset + i + 1,
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
      totalParents,
    };
  }
}
