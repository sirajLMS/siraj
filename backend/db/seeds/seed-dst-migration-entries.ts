import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { dstMigrationEntries } from "@/backend/db/schema/scheduling";
import logger from "@/backend/lib/logger";
import type { RecurringScheduleEntity } from "@/backend/types";
import { DstMigrationResult } from "@/shared/lib/enum";

type DstMigrationRunRow = { id: string };

export async function seedOrGet(runsList: DstMigrationRunRow[], classesList: RecurringScheduleEntity[]) {
  logger.info("Seeding DST migration entries...");
  if (!runsList?.length || !classesList?.length) {
    return [];
  }

  const run = runsList[0];
  const results = [];
  const outcomes = [DstMigrationResult.UPDATED, DstMigrationResult.UNCHANGED, DstMigrationResult.CONFLICT];

  for (let i = 0; i < Math.min(3, classesList.length); i++) {
    const schedule = classesList[i];

    const [existing] = await db
      .select()
      .from(dstMigrationEntries)
      .where(eq(dstMigrationEntries.recurringScheduleId, schedule.id))
      .limit(1);

    if (existing) {
      results.push(existing);
      continue;
    }

    const [inserted] = await db
      .insert(dstMigrationEntries)
      .values({
        runId: run.id,
        recurringScheduleId: schedule.id,
        result: outcomes[i % outcomes.length],
        conflictDetail: outcomes[i % outcomes.length] === DstMigrationResult.CONFLICT ? "Overlap detected" : null,
      })
      .returning();
    results.push(inserted);
  }

  logger.info(`DST migration entries seeded (${results.length} rows).`);
  return results;
}
