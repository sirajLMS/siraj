import {
  buildScheduleDaysForStudent,
  buildShowcaseInstancesForToday,
  generateClassInstancesForSchedule,
  loadSeedConfig,
  type ScheduleContext,
  type SeedConfig,
} from "@/backend/db/seeds/lib";
import logger from "@/backend/lib/logger";
import { ClassSessionService } from "@/backend/services/session/class-session.service";
import type { ClassInstanceInsertInput, RecurringScheduleEntity, StudentEntity, TeacherEntity } from "@/backend/types";

const CHUNK_SIZE = 100;

export async function seedOrGet(
  classesList: RecurringScheduleEntity[],
  teachersList: TeacherEntity[],
  studentsList: StudentEntity[],
  config?: SeedConfig
) {
  logger.info("Seeding system class instances...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!classesList?.length || !teachersList?.length || !studentsList?.length) {
    throw new Error("Missing required seed data for class instances.");
  }

  const studentById = new Map(studentsList.map(s => [s.id, s]));
  const teacherById = new Map(teachersList.map(t => [t.id, t]));
  const demoStudent = studentsList[0];
  const allInstances: ClassInstanceInsertInput[] = [];

  for (let i = 0; i < classesList.length; i++) {
    const schedule = classesList[i];
    const student = studentById.get(schedule.studentId);
    const teacher = teacherById.get(schedule.teacherId);
    if (!student || !teacher) continue;

    const days = buildScheduleDaysForStudent(seedConfig, i);
    const isDemoSchedule = student.id === demoStudent.id;

    const context: ScheduleContext = {
      scheduleId: schedule.id,
      studentId: student.id,
      teacherId: teacher.id,
      durationMinutes: schedule.durationMinutes,
      days,
      isDemoSchedule,
    };

    const generated = generateClassInstancesForSchedule(context, i, seedConfig, now);
    allInstances.push(...generated);

    if (isDemoSchedule) {
      allInstances.push(...buildShowcaseInstancesForToday(context, seedConfig, now));
    }
  }

  const results = [];
  for (let i = 0; i < allInstances.length; i += CHUNK_SIZE) {
    const chunk = allInstances.slice(i, i + CHUNK_SIZE);
    const inserted = await ClassSessionService.upsertManyClassInstances(chunk, {
      chunkSize: CHUNK_SIZE,
      updatedAt: now,
    });
    results.push(...inserted);
    logger.info(`Class instances progress: ${Math.min(i + CHUNK_SIZE, allInstances.length)}/${allInstances.length}`);
  }

  logger.info(`System class instances seeded (${results.length} total).`);
  return results;
}
