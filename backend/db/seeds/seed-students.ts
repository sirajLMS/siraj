import * as path from "node:path";
import { and, eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { StorageDbRepository } from "@/backend/db/repo";
import { students, teacherAssignments } from "@/backend/db/schema/students";
import logger from "@/backend/lib/logger";
import { createFileSeedingService } from "@/backend/storage/demo/fileInitializationService";
import { getStorageService } from "@/backend/storage/storage.service";
import type { ParentEntity, TeacherEntity } from "@/backend/types";
import { StudentStatus } from "@/shared/lib/enum";
import {
  ALL_STUDENT_STATUSES,
  buildStudentName,
  cycleAtIndex,
  getStudentAvatarFileName,
  getTotalStudents,
  loadSeedConfig,
  type SeedConfig,
} from "./lib";

const DEMO_STUDENTS = [
  { name: "Demo Student", idempotencyKey: "demo_student_1", timezoneOverride: null as string | null, avatarIndex: 1 },
  {
    name: "Demo Student London",
    idempotencyKey: "demo_student_london_1",
    timezoneOverride: "Europe/London",
    avatarIndex: 2,
  },
] as const;

async function upsertStudent(
  parentId: string,
  teacherId: string,
  name: string,
  timezoneOverride: string | null,
  idempotencyKey: string,
  avatarUrl: string | null,
  status: StudentStatus,
  now: Date
) {
  const [result] = await db
    .insert(students)
    .values({
      parentId,
      primaryTeacherId: teacherId,
      name,
      avatarUrl,
      status,
      classesTotal: 10,
      classesRemaining: status === StudentStatus.GRADUATED ? 0 : 5,
      version: 1,
      timezoneOverride,
      idempotencyKey,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: students.idempotencyKey,
      set: {
        name,
        avatarUrl,
        timezoneOverride,
        primaryTeacherId: teacherId,
        parentId,
        updatedAt: now,
      },
    })
    .returning();
  return result;
}

async function ensureTeacherAssignment(studentId: string, teacherId: string, assignedAt: Date) {
  const existing = await db
    .select()
    .from(teacherAssignments)
    .where(and(eq(teacherAssignments.studentId, studentId), eq(teacherAssignments.teacherId, teacherId)))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(teacherAssignments).values({
      studentId,
      teacherId,
      assignedAt,
    });
  }
}

async function seedAvatarAssets(): Promise<Map<string, string | null>> {
  const avatarUrls = new Map<string, string | null>();

  try {
    const fileSeeder = await createFileSeedingService();
    await fileSeeder.ensureDirectory("public", true);
    await fileSeeder.ensureDirectory("public/avatars", true);
    await fileSeeder.ensureDirectory("public/avatars/students", true);

    const storageService = await getStorageService();

    for (let i = 1; i <= 8; i++) {
      const fileName = `${String(i).padStart(2, "0")}.png`;
      const bucketPath = `public/avatars/students/${fileName}`;
      const localFilePath = path.join(__dirname, "assets", "avatars", "students", fileName);
      await fileSeeder.seedFile({ bucketPath, localFilePath });
      const fileInfo = await storageService.fileInfoByPath(bucketPath);
      avatarUrls.set(fileName, fileInfo?.url ?? null);
    }

    logger.info("Student avatar assets seeded successfully.");
  } catch (error) {
    logger.error("Failed to seed student avatars:", error);
  }

  return avatarUrls;
}

function getAvatarUrl(avatarUrls: Map<string, string | null>, index: number): string | null {
  const fileName = getStudentAvatarFileName(index);
  return avatarUrls.get(fileName) ?? null;
}

export async function seedOrGet(parentsList: ParentEntity[], teachersList: TeacherEntity[], config?: SeedConfig) {
  logger.info("Seeding system students...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!parentsList?.length) {
    throw new Error("No parents available to link to students.");
  }
  if (!teachersList?.length) {
    throw new Error("No teachers available to link to students.");
  }

  const avatarUrls = await seedAvatarAssets();
  const totalStudents = getTotalStudents(seedConfig);
  const results = [];
  const assignmentDate = new Date("2020-01-01");

  for (let i = 0; i < totalStudents; i++) {
    const parent = parentsList[i % parentsList.length];
    const teacher = teachersList[i % teachersList.length];
    const avatarUrl = getAvatarUrl(avatarUrls, i);

    let name: string;
    let idempotencyKey: string;
    let timezoneOverride: string | null = null;

    if (i < DEMO_STUDENTS.length) {
      const demo = DEMO_STUDENTS[i];
      name = demo.name;
      idempotencyKey = demo.idempotencyKey;
      timezoneOverride = demo.timezoneOverride;
    } else {
      const extraIndex = i - DEMO_STUDENTS.length + 1;
      name = buildStudentName(seedConfig, extraIndex);
      idempotencyKey = `seed_student_${extraIndex}`;
    }

    const status = i === 0 ? StudentStatus.REGULAR : cycleAtIndex(ALL_STUDENT_STATUSES, i);

    const student = await upsertStudent(
      parent.id,
      teacher.id,
      name,
      timezoneOverride,
      idempotencyKey,
      avatarUrl,
      status,
      now
    );
    results.push(student);

    await ensureTeacherAssignment(student.id, teacher.id, assignmentDate);

    if (avatarUrl) {
      const fileName = getStudentAvatarFileName(i);
      try {
        await StorageDbRepository.registerFileUsage({
          referenceTable: "students",
          referenceId: student.id,
          usageType: "avatar",
          filePath: `public/avatars/students/${fileName}`,
        });
      } catch (error) {
        logger.error(`Failed to register avatar usage for student ${student.id}:`, error);
      }
    }
  }

  logger.info(`System students seeded (${results.length} total).`);
  return results;
}
