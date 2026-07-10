import {
  buildScheduleDaysForStudent,
  isScheduleDayActive,
  loadSeedConfig,
  type SeedConfig,
} from "@/backend/db/seeds/lib";
import logger from "@/backend/lib/logger";
import { RecurringClassService } from "@/backend/services/schedule/recurring-class.service";
import type { RecurringScheduleDayInsertInput, RecurringScheduleEntity } from "@/backend/types";

type ScheduleDaySpec = {
  recurringScheduleId: string;
  dayOfWeek: RecurringScheduleDayInsertInput["dayOfWeek"];
  startTime: string;
  isActive: boolean;
};

export async function seedOrGet(classesList: RecurringScheduleEntity[], config?: SeedConfig) {
  logger.info("Seeding recurring schedule days...");
  const seedConfig = config ?? loadSeedConfig();

  if (!classesList?.length) {
    throw new Error("No recurring schedules available for schedule days seeding.");
  }

  const specs: ScheduleDaySpec[] = [];
  for (let i = 0; i < classesList.length; i++) {
    const schedule = classesList[i];
    const daySpecs = buildScheduleDaysForStudent(seedConfig, i);

    for (let dayIndex = 0; dayIndex < daySpecs.length; dayIndex++) {
      const daySpec = daySpecs[dayIndex];
      specs.push({
        recurringScheduleId: schedule.id,
        dayOfWeek: daySpec.dayOfWeek,
        startTime: daySpec.startTime,
        isActive: isScheduleDayActive(i, dayIndex),
      });
    }
  }

  const results = await RecurringClassService.upsertManyScheduleDays(specs);
  logger.info(`Recurring schedule days seeded (${results.length} rows).`);
  return results;
}
