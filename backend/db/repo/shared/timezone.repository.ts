import { inArray } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { timezones } from "@/backend/db/schema/shared/timezones";
import type { TimezoneSelectType } from "@/backend/types";
import type { TimezoneUpsertInput } from "@/backend/types/scheduling/scheduling.types";

export namespace TimezoneRepository {
  export async function listAll(tx?: DBTransaction): Promise<TimezoneSelectType[]> {
    const q = queryDb(tx);
    return q.select().from(timezones);
  }

  export async function findByIanaIds(ianaIds: string[], tx?: DBTransaction): Promise<TimezoneSelectType[]> {
    if (ianaIds.length === 0) return [];
    const q = queryDb(tx);
    return q.select().from(timezones).where(inArray(timezones.ianaId, ianaIds));
  }

  export async function upsertMany(inputs: TimezoneUpsertInput[], tx?: DBTransaction): Promise<TimezoneSelectType[]> {
    if (inputs.length === 0) return [];
    const dbToQuery = tx ?? db;
    const results: TimezoneSelectType[] = [];

    for (const input of inputs) {
      const [row] = await dbToQuery
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
