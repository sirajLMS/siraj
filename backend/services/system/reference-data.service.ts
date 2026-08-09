import { sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { PermissionManagementRepository } from "@/backend/db/repo/permissions/permission-management.repository";
import { TimezoneRepository } from "@/backend/db/repo/shared/timezone.repository";
import type {
  GroupWithPermissionIds,
  PaginationArgs,
  SettingsTimezonesPaginatedResult,
  TimezoneSelectType,
  TimezoneUpsertInput,
} from "@/backend/types";
import { PaginationUtils } from "@/backend/utils/pagination.utils";

export namespace ReferenceDataService {
  export async function listTimezones(): Promise<TimezoneSelectType[]> {
    return TimezoneRepository.listAll();
  }

  export async function listTimezonesPaginated(
    pagination: PaginationArgs | null
  ): Promise<SettingsTimezonesPaginatedResult> {
    const sorted = [...(await TimezoneRepository.listAll())].toSorted((left, right) =>
      left.ianaId.localeCompare(right.ianaId)
    );
    const totalCount = sorted.length;

    if (!pagination) {
      return {
        id: "settings-timezones",
        rows: sorted,
        totalCount,
        pageInfo: null,
      };
    }

    const rows = sorted.slice(pagination.offset, pagination.offset + pagination.perPage);
    return {
      id: "settings-timezones",
      rows,
      totalCount,
      pageInfo: PaginationUtils.buildPageInfoFromArgs(pagination, rows.length, totalCount),
    };
  }

  export async function findTimezonesByIanaIds(ianaIds: string[]): Promise<TimezoneSelectType[]> {
    return TimezoneRepository.findByIanaIds(ianaIds);
  }

  export async function upsertManyTimezones(inputs: TimezoneUpsertInput[]): Promise<TimezoneSelectType[]> {
    return TimezoneRepository.upsertMany(inputs);
  }

  export async function listPermissionGroups(): Promise<GroupWithPermissionIds[]> {
    return PermissionManagementRepository.listAllGroups();
  }

  export async function getTableRowCounts(tableNames: string[]): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const tableName of tableNames) {
      const result = await db.execute(sql.raw(`SELECT COUNT(*)::int AS count FROM "${tableName}"`));
      if (Array.isArray(result)) {
        const row = result[0] as { count?: number } | undefined;
        counts[tableName] = (row?.count ?? 0);
      } else {
        const rows = (result as unknown as { rows?: { count: number }[] }).rows ?? [];
        counts[tableName] = (rows[0]?.count ?? 0);
      }
    }
    return counts;
  }
}
