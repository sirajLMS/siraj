import * as path from "node:path";
import { and, eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { StorageDbRepository } from "@/backend/db/repo";
import { students, teacherAssignments } from "@/backend/db/schema/students";
import logger from "@/backend/lib/logger";
import { createFileSeedingService } from "@/backend/storage/demo/fileInitializationService";
import { getStorageService } from "@/backend/storage/storage.service";
import type { ParentEntity, TeacherEntity } from "@/backend/types";

async function upsertStudent(
  parentId: string,
  teacherId: string,
  name: string,
  timezoneOverride: string | null,
  idempotencyKey: string,
  avatarUrl: string | null,
  now: Date
) {
  const [result] = await db
    .insert(students)
    .values({
      parentId,
      primaryTeacherId: teacherId,
      name,
      avatarUrl,
      status: "REGULAR",
      classesTotal: 10,
      classesRemaining: 5,
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
        status: "REGULAR",
        timezoneOverride,
        updatedAt: now,
      },
    })
    .returning();
  return result;
}

async function ensureTeacherAssignments(studentIds: string[], teacherId: string) {
  for (const studentId of studentIds) {
    const existing = await db
      .select()
      .from(teacherAssignments)
      .where(and(eq(teacherAssignments.studentId, studentId), eq(teacherAssignments.teacherId, teacherId)))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(teacherAssignments).values({
        studentId,
        teacherId,
        assignedAt: new Date("2020-01-01"),
      });
    }
  }
}

export async function seedOrGet(parentsList: ParentEntity[], teachersList: TeacherEntity[]) {
  logger.info("Seeding system students...");
  const now = new Date();

  if (!parentsList || parentsList.length === 0) {
    throw new Error("No parents available to link to students.");
  }
  if (!teachersList || teachersList.length === 0) {
    throw new Error("No teachers available to link to students.");
  }

  const defaultParent = parentsList[0];
  const defaultTeacher = teachersList[0];

  logger.info("Initializing student avatar storage...");
  let avatar1Url: string | null = null;
  let avatar2Url: string | null = null;

  try {
    const fileSeeder = await createFileSeedingService();
    await fileSeeder.ensureDirectory("public", true);
    await fileSeeder.ensureDirectory("public/avatars", true);
    await fileSeeder.ensureDirectory("public/avatars/students", true);

    const storageService = await getStorageService();

    // Student 1 Avatar
    const bucketPath1 = "public/avatars/students/01.png";
    const localFilePath1 = path.join(__dirname, "assets", "avatars", "students", "01.png");
    await fileSeeder.seedFile({
      bucketPath: bucketPath1,
      localFilePath: localFilePath1,
    });
    const fileInfo1 = await storageService.fileInfoByPath(bucketPath1);
    avatar1Url = fileInfo1?.url ?? null;

    // Student 2 Avatar
    const bucketPath2 = "public/avatars/students/02.png";
    const localFilePath2 = path.join(__dirname, "assets", "avatars", "students", "02.png");
    await fileSeeder.seedFile({
      bucketPath: bucketPath2,
      localFilePath: localFilePath2,
    });
    const fileInfo2 = await storageService.fileInfoByPath(bucketPath2);
    avatar2Url = fileInfo2?.url ?? null;

    logger.info("Student avatars seeded successfully.");
  } catch (error) {
    logger.error("Failed to seed student avatars:", error);
  }

  const student1 = await upsertStudent(
    defaultParent.id,
    defaultTeacher.id,
    "Demo Student",
    null,
    "demo_student_1",
    avatar1Url,
    now
  );

  const student2 = await upsertStudent(
    defaultParent.id,
    defaultTeacher.id,
    "Demo Student London",
    "Europe/London",
    "demo_student_london_1",
    avatar2Url,
    now
  );

  await ensureTeacherAssignments([student1.id, student2.id], defaultTeacher.id);

  // Register usages in student_files
  try {
    if (avatar1Url) {
      await StorageDbRepository.registerFileUsage({
        referenceTable: "students",
        referenceId: student1.id,
        usageType: "avatar",
        filePath: "public/avatars/students/01.png",
      });
    }
    if (avatar2Url) {
      await StorageDbRepository.registerFileUsage({
        referenceTable: "students",
        referenceId: student2.id,
        usageType: "avatar",
        filePath: "public/avatars/students/02.png",
      });
    }
    logger.info("Student avatar usages registered successfully.");
  } catch (error) {
    logger.error("Failed to register student avatar usages:", error);
  }

  logger.info("System students seeded.");
  return [student1, student2];
}
