import { inArray } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import { timezones } from "@/backend/db/schema";
import type { DBTransaction, TimezoneSelectType, TimezoneUpsertInput } from "@/backend/types";

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

    const rows = await Promise.all(
      inputs.map(input =>
        dbToQuery
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
          .returning()
      )
    );

    return rows.map(([row]) => row);
  }
}
