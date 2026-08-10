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

interface CountRow {
  count?: number;
}

interface QueryResultLike {
  rows?: CountRow[];
}

function isCountRow(value: unknown): value is CountRow {
  return typeof value === "object" && value !== null && !Array.isArray(value) && "count" in value;
}

function isQueryResultLike(value: unknown): value is QueryResultLike {
  return typeof value === "object" && value !== null && !Array.isArray(value) && "rows" in value;
}

function extractCount(result: unknown): number {
  if (Array.isArray(result)) {
    const row = result[0];
    return isCountRow(row) ? (row.count ?? 0) : 0;
  }
  if (isQueryResultLike(result)) {
    const rows = result.rows ?? [];
    return isCountRow(rows[0]) ? (rows[0].count ?? 0) : 0;
  }
  return 0;
}

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
    const entries = await Promise.all(
      tableNames.map(async tableName => {
        const result = await db.execute(sql.raw(`SELECT COUNT(*)::int AS count FROM "${tableName}"`));
        return [tableName, extractCount(result)] as const;
      })
    );
    return Object.fromEntries(entries);
  }
}
