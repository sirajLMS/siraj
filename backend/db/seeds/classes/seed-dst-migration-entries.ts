import { orchestrateSeedMany } from "@/backend/db/seeds/lib";
import { DstMigrationResult } from "@/backend/enum";
import logger from "@/backend/lib/logger";
import { DstMigrationService } from "@/backend/services/system/dst-migration.service";
import type { DstMigrationEntrySelectType, RecurringScheduleSelectType } from "@/backend/types";

type DstMigrationRunRow = { id: string };

type EntrySpec = {
  runId: string;
  recurringScheduleId: string;
  result: DstMigrationResult;
  conflictDetail: string | null;
};

export async function seedOrGet(runsList: DstMigrationRunRow[], classesList: RecurringScheduleSelectType[]) {
  logger.info("Seeding DST migration entries...");
  if (!runsList?.length || !classesList?.length) {
    return [];
  }

  const run = runsList[0];
  const outcomes = [DstMigrationResult.UPDATED, DstMigrationResult.UNCHANGED, DstMigrationResult.CONFLICT];
  const specs: EntrySpec[] = [];

  for (let i = 0; i < Math.min(3, classesList.length); i++) {
    const schedule = classesList[i];
    const result = outcomes[i % outcomes.length];
    specs.push({
      runId: run.id,
      recurringScheduleId: schedule.id,
      result,
      conflictDetail: result === DstMigrationResult.CONFLICT ? "Overlap detected" : null,
    });
  }

  const results = await orchestrateSeedMany<EntrySpec, DstMigrationEntrySelectType, string>({
    specs,
    toKey: spec => spec.recurringScheduleId,
    findExisting: async keys => {
      const rows = await DstMigrationService.findMigrationEntriesByScheduleIds(keys);
      return new Map(rows.map(row => [row.recurringScheduleId, row]));
    },
    createMany: async toCreate => DstMigrationService.createManyMigrationEntries(toCreate),
    refetchOnRace: async keys => {
      const rows = await DstMigrationService.findMigrationEntriesByScheduleIds(keys);
      return new Map(rows.map(row => [row.recurringScheduleId, row]));
    },
  });

  logger.info(`DST migration entries seeded (${results.length} rows).`);
  return results;
}
