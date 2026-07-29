import {
  buildScheduleDaysForStudent,
  buildShowcaseInstancesForToday,
  generateClassInstancesForSchedule,
  loadSeedConfig,
  type ScheduleContext,
  type SeedConfig,
  seedEntityFile,
  shouldSeedExtendedFiles,
} from "@/backend/db/seeds/lib";
import logger from "@/backend/lib/logger";
import { ClassSessionService } from "@/backend/services/session/class-session.service";
import type {
  ClassInstanceEntity,
  ClassInstanceInsertInput,
  RecurringScheduleEntity,
  StudentEntity,
  TeacherEntity,
} from "@/backend/types";

const CHUNK_SIZE = 100;

function buildAllClassInstances(
  classesList: RecurringScheduleEntity[],
  teachersList: TeacherEntity[],
  studentsList: StudentEntity[],
  seedConfig: SeedConfig,
  now: Date
): ClassInstanceInsertInput[] {
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
      subjectId: schedule.subjectId,
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

  return allInstances;
}

async function insertClassInstances(
  allInstances: ClassInstanceInsertInput[],
  now: Date
): Promise<ClassInstanceEntity[]> {
  const results: ClassInstanceEntity[] = [];
  for (let i = 0; i < allInstances.length; i += CHUNK_SIZE) {
    const chunk = allInstances.slice(i, i + CHUNK_SIZE);
    const inserted = await ClassSessionService.upsertManyClassInstancesForSeed(chunk, {
      chunkSize: CHUNK_SIZE,
      updatedAt: now,
    });
    results.push(...inserted);
    logger.info(`Class instances progress: ${Math.min(i + CHUNK_SIZE, allInstances.length)}/${allInstances.length}`);
  }
  return results;
}

async function seedClassInstanceFiles(results: ClassInstanceEntity[], seedConfig: SeedConfig): Promise<void> {
  if (!shouldSeedExtendedFiles(seedConfig)) return;

  for (let i = 0; i < Math.min(results.length, 3); i++) {
    const instance = results[i];
    if (!instance) continue;

    try {
      await seedEntityFile({
        assetRelativePath: "documents/sample-attachment.pdf",
        bucketPath: `public/class-instances/seed_${instance.id}.pdf`,
        referenceTable: "class_instances",
        referenceId: instance.id,
        usageType: "attachment",
        ensureParentDirs: ["public/class-instances"],
      });
    } catch (error) {
      logger.error(`Failed to seed class instance file for ${instance.id}:`, error);
    }
  }
}

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

  const allInstances = buildAllClassInstances(classesList, teachersList, studentsList, seedConfig, now);
  const results = await insertClassInstances(allInstances, now);
  await seedClassInstanceFiles(results, seedConfig);

  logger.info(`System class instances seeded (${results.length} total).`);
  return results;
}
