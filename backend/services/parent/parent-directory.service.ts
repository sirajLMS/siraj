import { ParentRepository } from "@/backend/db/repo/parents";
import { AppPermission, ParentStatus } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { cachedRead, stableStringify } from "@/backend/services/cache";
import type {
  PaginationArgs,
  ParentDirectoryAutocompleteRow,
  ParentDirectoryResult,
  ParentDirectoryRow,
} from "@/backend/types";
import { parseAccountStatus, parseParentStatus } from "@/shared/lib/enum";
import { getServerTranslations } from "@/shared/locale";

const PARENTS_DIRECTORY_MAX_LIMIT = 100;

export namespace ParentDirectoryService {
  async function assertDirectoryAccess(actorUserId: string, locale?: string): Promise<void> {
    const isAuthorized = await PermissionsService.hasAnyPermission(actorUserId, [
      AppPermission.PARENT_VIEW_DIRECTORY,
      AppPermission.PARENTS_LIST,
    ]);
    if (!isAuthorized) {
      const tFunc = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(tFunc.insufficientPermissions);
    }
  }

  /**
   * Retrieves the parent directory with metrics and rows.
   * Requires: parent.view_directory or parents.list permission.
   */
  export async function getParentDirectory(
    actorUserId: string,
    search: string | null,
    pagination: PaginationArgs | null,
    lifecycleStatus: ParentStatus | null,
    locale?: string
  ): Promise<ParentDirectoryResult> {
    await assertDirectoryAccess(actorUserId, locale);

    const context = await PermissionsService.getUserContext(actorUserId);
    const roleId = context?.role ?? "anonymous";
    const cacheKey = `ec:parent:dir:${roleId}:${stableStringify({ search, pagination, lifecycleStatus })}`;

    return await cachedRead(
      cacheKey,
      30,
      async () => {
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
      },
      ["parentDirectory"]
    );
  }

  /**
   * Lightweight parent list for autocomplete.
   * Requires: parent.view_directory or parents.list permission.
   */
  export async function getParentsDirectory(
    actorUserId: string,
    search: string | null,
    limit: number,
    locale?: string
  ): Promise<ParentDirectoryAutocompleteRow[]> {
    await assertDirectoryAccess(actorUserId, locale);

    const cappedLimit = Math.min(Math.max(limit, 1), PARENTS_DIRECTORY_MAX_LIMIT);
    const trimmedSearch = search?.trim() ?? null;

    return await ParentRepository.findParentsDirectoryLite({
      search: trimmedSearch,
      limit: cappedLimit,
    });
  }
}
