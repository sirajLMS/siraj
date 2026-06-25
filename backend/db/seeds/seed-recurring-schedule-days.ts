import { db } from "@/backend/db/drizzleDb";
import { recurringScheduleDays } from "@/backend/db/schema/scheduling";
import logger from "@/backend/lib/logger";
import type { RecurringScheduleEntity } from "@/backend/types";
import { buildScheduleDaysForStudent, loadSeedConfig, type SeedConfig } from "./lib";

export async function seedOrGet(classesList: RecurringScheduleEntity[], config?: SeedConfig) {
  logger.info("Seeding recurring schedule days...");
  const seedConfig = config ?? loadSeedConfig();

  if (!classesList?.length) {
    throw new Error("No recurring schedules available for schedule days seeding.");
  }

  const results = [];

  for (let i = 0; i < classesList.length; i++) {
    const schedule = classesList[i];
    const daySpecs = buildScheduleDaysForStudent(seedConfig, i);

    for (const daySpec of daySpecs) {
      const [inserted] = await db
        .insert(recurringScheduleDays)
        .values({
          recurringScheduleId: schedule.id,
          dayOfWeek: daySpec.dayOfWeek,
          startTime: daySpec.startTime,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: [recurringScheduleDays.recurringScheduleId, recurringScheduleDays.dayOfWeek],
          set: {
            startTime: daySpec.startTime,
            isActive: true,
          },
        })
        .returning();

      results.push(inserted);
    }
  }

  logger.info(`Recurring schedule days seeded (${results.length} rows).`);
  return results;
}
