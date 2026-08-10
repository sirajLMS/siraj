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
import { logger } from "@/backend/lib/logger";
import { ClassSessionService } from "@/backend/services/session/class-session.service";
import type {
  ClassInstanceInsertType,
  ClassInstanceSelectType,
  RecurringScheduleSelectType,
  StudentSelectType,
  TeacherSelectType,
} from "@/backend/types";

const CHUNK_SIZE = 100;

function buildAllClassInstances(
  classesList: RecurringScheduleSelectType[],
  teachersList: TeacherSelectType[],
  studentsList: StudentSelectType[],
  seedConfig: SeedConfig,
  now: Date
): ClassInstanceInsertType[] {
  const studentById = new Map(studentsList.map(s => [s.id, s]));
  const teacherById = new Map(teachersList.map(t => [t.id, t]));
  const demoStudent = studentsList[0];
  const allInstances: ClassInstanceInsertType[] = [];

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
  allInstances: ClassInstanceInsertType[],
  now: Date
): Promise<ClassInstanceSelectType[]> {
  const chunkCount = Math.ceil(allInstances.length / CHUNK_SIZE);
  const chunks = Array.from({ length: chunkCount }, (_, i) => allInstances.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
  let completed = 0;
  const insertedChunks = await Promise.all(
    chunks.map(async chunk => {
      const inserted = await ClassSessionService.upsertManyClassInstancesForSeed(chunk, {
        chunkSize: CHUNK_SIZE,
        updatedAt: now,
      });
      completed += inserted.length;
      logger.info(`Class instances progress: ${completed}/${allInstances.length}`);
      return inserted;
    })
  );
  return insertedChunks.flat();
}

async function seedClassInstanceFiles(results: ClassInstanceSelectType[], seedConfig: SeedConfig): Promise<void> {
  if (!shouldSeedExtendedFiles(seedConfig)) return;

  const instances = results.slice(0, 3).filter((instance): instance is ClassInstanceSelectType => Boolean(instance));

  const outcomes = await Promise.allSettled(
    instances.map(instance =>
      seedEntityFile({
        assetRelativePath: "documents/sample-attachment.pdf",
        bucketPath: `public/class-instances/seed_${instance.id}.pdf`,
        referenceTable: "class_instances",
        referenceId: instance.id,
        usageType: "attachment",
        ensureParentDirs: ["public/class-instances"],
      })
    )
  );

  for (let i = 0; i < outcomes.length; i++) {
    const outcome = outcomes[i];
    const instance = instances[i];
    if (outcome?.status === "rejected" && instance) {
      logger.error(`Failed to seed class instance file for ${instance.id}:`, outcome.reason);
    }
  }
}

export async function seedOrGet(
  classesList: RecurringScheduleSelectType[],
  teachersList: TeacherSelectType[],
  studentsList: StudentSelectType[],
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
