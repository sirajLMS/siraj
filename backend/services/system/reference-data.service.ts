import { sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { PermissionManagementRepository } from "@/backend/db/repo/permissions/permission-management.repository";
import { TimezoneRepository } from "@/backend/db/repo/shared/timezone.repository";
import type { GroupWithPermissionIds, TimezoneEntity, TimezoneUpsertInput } from "@/backend/types";

export namespace ReferenceDataService {
  export async function listTimezones(): Promise<TimezoneEntity[]> {
    return TimezoneRepository.listAll();
  }

  export async function findTimezonesByIanaIds(ianaIds: string[]): Promise<TimezoneEntity[]> {
    return TimezoneRepository.findByIanaIds(ianaIds);
  }

  export async function upsertManyTimezones(inputs: TimezoneUpsertInput[]): Promise<TimezoneEntity[]> {
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
        counts[tableName] = Number(row?.count ?? 0);
      } else {
        const rows = (result as unknown as { rows?: { count: number }[] }).rows ?? [];
        counts[tableName] = Number(rows[0]?.count ?? 0);
      }
    }
    return counts;
  }
}
