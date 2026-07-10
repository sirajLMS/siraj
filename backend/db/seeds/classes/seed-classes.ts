import {
  formatDateKey,
  getDateWindow,
  loadSeedConfig,
  pickScheduleDefaultStartTime,
  pickScheduleDurationMinutes,
  pickTimezoneForIndex,
  type SeedConfig,
} from "@/backend/db/seeds/lib";
import logger from "@/backend/lib/logger";
import { RecurringClassService } from "@/backend/services/schedule/recurring-class.service";
import type { StudentEntity, TeacherEntity } from "@/backend/types";

export async function seedOrGet(teachersList: TeacherEntity[], studentsList: StudentEntity[], config?: SeedConfig) {
  logger.info("Seeding system classes (recurring schedules)...");
  const seedConfig = config ?? loadSeedConfig();
  const { start, end } = getDateWindow(seedConfig.anchorDate, seedConfig.monthsBefore, seedConfig.monthsAfter);

  if (!teachersList?.length || !studentsList?.length) {
    throw new Error("Missing teachers or students for recurring schedule seeding.");
  }

  const inputs = studentsList.map((student, i) => ({
    teacherId: teachersList[i % teachersList.length].id,
    studentId: student.id,
    durationMinutes: pickScheduleDurationMinutes(i),
    defaultStartTime: pickScheduleDefaultStartTime(i),
    timezone: student.timezoneOverride ?? pickTimezoneForIndex(i),
    effectiveFrom: formatDateKey(start),
    effectiveUntil: formatDateKey(end),
  }));

  const results = await RecurringClassService.upsertManyRecurringSchedules(inputs);
  logger.info(`System classes seeded (${results.length} recurring schedules).`);
  return results;
}
