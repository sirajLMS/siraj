import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { recurringSchedules } from "@/backend/db/schema/scheduling";
import logger from "@/backend/lib/logger";
import type { StudentEntity, TeacherEntity } from "@/backend/types";
import { formatDateKey, getDateWindow, loadSeedConfig, pickScheduleDefaultStartTime, pickScheduleDurationMinutes, pickTimezoneForIndex, type SeedConfig } from "./lib";

export async function seedOrGet(teachersList: TeacherEntity[], studentsList: StudentEntity[], config?: SeedConfig) {
  logger.info("Seeding system classes (recurring schedules)...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();
  const { start, end } = getDateWindow(seedConfig.anchorDate, seedConfig.monthsBefore, seedConfig.monthsAfter);

  if (!teachersList?.length || !studentsList?.length) {
    throw new Error("Missing teachers or students for recurring schedule seeding.");
  }

  const results = [];

  for (let i = 0; i < studentsList.length; i++) {
    const student = studentsList[i];
    const teacher = teachersList[i % teachersList.length];
    const timezone = student.timezoneOverride ?? pickTimezoneForIndex(i);

    const durationMinutes = pickScheduleDurationMinutes(i);
    const defaultStartTime = pickScheduleDefaultStartTime(i);

    const [existing] = await db
      .select()
      .from(recurringSchedules)
      .where(eq(recurringSchedules.studentId, student.id))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(recurringSchedules)
        .set({
          teacherId: teacher.id,
          durationMinutes,
          defaultStartTime,
          timezone,
          effectiveFrom: formatDateKey(start),
          effectiveUntil: formatDateKey(end),
          updatedAt: now,
        })
        .where(eq(recurringSchedules.id, existing.id))
        .returning();
      results.push(updated);
      continue;
    }

    const [insertedClass] = await db
      .insert(recurringSchedules)
      .values({
        teacherId: teacher.id,
        studentId: student.id,
        durationMinutes,
        defaultStartTime,
        timezone,
        effectiveFrom: formatDateKey(start),
        effectiveUntil: formatDateKey(end),
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    results.push(insertedClass);
  }

  logger.info(`System classes seeded (${results.length} recurring schedules).`);
  return results;
}
