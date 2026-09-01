import { getTableName, isTable, sql } from "drizzle-orm";
import { isSqlite } from "@/backend/db/dialect";
import { db } from "@/backend/db/drizzleDb";
import { PermissionManagementRepository } from "@/backend/db/repo/permissions/permission-management.repository";
import { TimezoneRepository } from "@/backend/db/repo/shared/timezone.repository";
import * as schema from "@/backend/db/schema";
import { logger } from "@/backend/lib/logger";
import type {
  GroupWithPermissionIds,
  PaginationArgs,
  SettingsTimezonesPaginatedResult,
  TimezoneSelectType,
  TimezoneUpsertInput,
} from "@/backend/types";
import { PaginationUtils } from "@/backend/utils/pagination.utils";

/**
 * Allowlist of every Drizzle-managed table, built at module load time from the
 * runtime schema so it tracks the codebase automatically as tables are added
 * or removed. Guards {@link getTableRowCounts} against SQL injection by
 * rejecting table names that are not part of the schema before they reach the
 * database driver.
 */
const KNOWN_TABLES: ReadonlySet<string> = (() => {
  const names = new Set<string>();
  for (const value of Object.values(schema)) {
    if (isTableLike(value)) {
      names.add(getTableName(value));
    }
  }
  return names;
})();

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

interface SqliteDb {
  all(q: unknown): Promise<Record<string, unknown>[]>;
}

function isSqliteDb(target: unknown): target is SqliteDb {
  if (typeof target !== "object" || target === null) return false;
  return typeof Reflect.get(target, "all") === "function";
}

function isTableLike(value: unknown): value is Parameters<typeof getTableName>[0] {
  return isTable(value);
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

  export async function upsertManyTimezones(inputs: TimezoneUpsertInput[]): Promise<TimezoneSelectType[]> {
    return TimezoneRepository.upsertMany(inputs);
  }

  export async function listPermissionGroups(): Promise<GroupWithPermissionIds[]> {
    return PermissionManagementRepository.listAllGroups();
  }

  export async function getTableRowCounts(tableNames: string[]): Promise<Record<string, number>> {
    for (const tableName of tableNames) {
      if (!KNOWN_TABLES.has(tableName)) {
        logger.error(
          `getTableRowCounts rejected unknown table name "${tableName}" — not present in Drizzle schema allowlist. This indicates either a stale caller or an injection attempt.`
        );
        throw new Error(`Table "${tableName}" is not a known database table; refusing to execute raw count query.`);
      }
    }

    const entries = await Promise.all(
      tableNames.map(async tableName => {
        const count =
          isSqlite() && isSqliteDb(db)
            ? Number((await db.all(sql`SELECT COUNT(*) AS count FROM ${sql.identifier(tableName)}`))[0]?.count ?? 0)
            : extractCount(await db.execute(sql`SELECT COUNT(*)::int AS count FROM ${sql.identifier(tableName)}`));
        return [tableName, count] as const;
      })
    );
    return Object.fromEntries(entries);
  }
}
