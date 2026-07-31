import { inArray } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { timezones } from "@/backend/db/schema/shared/timezones";
import type { TimezoneEntity } from "@/backend/types";
import type { TimezoneUpsertInput } from "@/backend/types/scheduling/scheduling.types";

// ============================================================================
// Prepared Statements (Drizzle Prepared Statements 2.0)
// ============================================================================
// These are defined at module level to be compiled once and reused across requests.
// Note: Prepared statements cannot be used inside transactions (they're tied to the session they were created with).

const listAllPrepared = db.select().from(timezones).prepare("list_all_timezones");

export namespace TimezoneRepository {
  export async function listAll(tx?: DBTransaction): Promise<TimezoneEntity[]> {
    if (!tx) {
      return listAllPrepared.execute();
    }
    return tx.select().from(timezones);
  }

  export async function findByIanaIds(ianaIds: string[], tx?: DBTransaction): Promise<TimezoneEntity[]> {
    if (ianaIds.length === 0) return [];
    const queryDb = tx ?? db;
    return queryDb.select().from(timezones).where(inArray(timezones.ianaId, ianaIds));
  }

  export async function upsertMany(inputs: TimezoneUpsertInput[], tx?: DBTransaction): Promise<TimezoneEntity[]> {
    if (inputs.length === 0) return [];
    const queryDb = tx ?? db;
    const results: TimezoneEntity[] = [];

    for (const input of inputs) {
      const [row] = await queryDb
        .insert(timezones)
        .values({
          ianaId: input.ianaId,
          baseOffsetMinutes: input.baseOffsetMinutes,
          isDstSupported: input.isDstSupported ?? true,
        })
        .onConflictDoUpdate({
          target: timezones.ianaId,
          set: {
            baseOffsetMinutes: input.baseOffsetMinutes,
            isDstSupported: input.isDstSupported ?? true,
          },
        })
        .returning();
      results.push(row);
    }

    return results;
  }
}
