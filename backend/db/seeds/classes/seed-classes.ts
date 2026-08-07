import {
  formatDateKey,
  getDateWindow,
  loadSeedConfig,
  pickScheduleDefaultStartTime,
  pickScheduleDurationMinutes,
  pickTimezoneForIndex,
  type SeedConfig,
  seedEntityFile,
  shouldSeedExtendedFiles,
} from "@/backend/db/seeds/lib";
import { logger } from "@/backend/lib/logger";
import { ClassCatalogService } from "@/backend/services/classes/class-catalog.service";
import { RecurringClassService } from "@/backend/services/schedule/recurring-class.service";
import type { StudentSelectType, TeacherSelectType } from "@/backend/types";

export async function seedOrGet(
  teachersList: TeacherSelectType[],
  studentsList: StudentSelectType[],
  config?: SeedConfig
) {
  logger.info("Seeding system classes (recurring schedules)...");
  const seedConfig = config ?? loadSeedConfig();
  const { start, end } = getDateWindow(seedConfig.anchorDate, seedConfig.monthsBefore, seedConfig.monthsAfter);

  if (!teachersList?.length || !studentsList?.length) {
    throw new Error("Missing teachers or students for recurring schedule seeding.");
  }

  const subjects = await ClassCatalogService.findSubjectsBySlugs(["tajweed", "hifz", "arabic-reading", "seerah"]);
  if (!subjects.length) {
    throw new Error("Missing class subjects for recurring schedule seeding. Seed subjects first.");
  }

  const inputs = studentsList.map((student, i) => ({
    teacherId: teachersList[i % teachersList.length].id,
    studentId: student.id,
    subjectId: subjects[i % subjects.length].id,
    durationMinutes: pickScheduleDurationMinutes(i),
    defaultStartTime: pickScheduleDefaultStartTime(i),
    timezone: student.timezoneOverride ?? pickTimezoneForIndex(i),
    effectiveFrom: formatDateKey(start),
    effectiveUntil: formatDateKey(end),
  }));

  const results = await RecurringClassService.upsertManyRecurringSchedules(inputs);

  if (shouldSeedExtendedFiles(seedConfig)) {
    for (const schedule of results) {
      if (!schedule) continue;

      try {
        await seedEntityFile({
          assetRelativePath: "documents/sample-attachment.pdf",
          bucketPath: `public/schedules/seed_${schedule.id}.pdf`,
          referenceTable: "recurring_schedules",
          referenceId: schedule.id,
          usageType: "attachment",
          ensureParentDirs: ["public/schedules"],
        });
      } catch (error) {
        logger.error(`Failed to seed recurring schedule file for ${schedule.id}:`, error);
      }
    }
  }

  logger.info(`System classes seeded (${results.length} recurring schedules).`);
  return results;
}
