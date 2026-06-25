import * as path from "node:path";
import { and, eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { StorageDbRepository } from "@/backend/db/repo";
import { students, teacherAssignments } from "@/backend/db/schema/students";
import logger from "@/backend/lib/logger";
import { createFileSeedingService } from "@/backend/storage/demo/fileInitializationService";
import type { ParentEntity, TeacherEntity } from "@/backend/types";

async function upsertStudent(
  parentId: string,
  teacherId: string,
  name: string,
  timezoneOverride: string | null,
  idempotencyKey: string,
  now: Date
) {
  const [result] = await db
    .insert(students)
    .values({
      parentId,
      primaryTeacherId: teacherId,
      name,
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

  const student1 = await upsertStudent(
    defaultParent.id,
    defaultTeacher.id,
    "Demo Student",
    null,
    "demo_student_1",
    now
  );

  const student2 = await upsertStudent(
    defaultParent.id,
    defaultTeacher.id,
    "Demo Student London",
    "Europe/London",
    "demo_student_london_1",
    now
  );

  await ensureTeacherAssignments([student1.id, student2.id], defaultTeacher.id);

  logger.info("Initializing student avatar storage...");
  try {
    const fileSeeder = await createFileSeedingService();
    await fileSeeder.ensureDirectory("public", true);
    await fileSeeder.ensureDirectory("public/avatars", true);
    await fileSeeder.ensureDirectory("public/avatars/students", true);

    const avatars = ["01.png", "02.png"];
    const studentsList = [student1, student2];

    for (let i = 0; i < studentsList.length; i++) {
      const student = studentsList[i];
      const avatarFileName = avatars[i];
      const bucketPath = `public/avatars/students/${avatarFileName}`;
      const localFilePath = path.join(__dirname, "assets", "avatars", "students", avatarFileName);

      logger.info(`Seeding avatar ${avatarFileName} for student ${student.name}...`);
      await fileSeeder.seedFile({
        bucketPath,
        localFilePath,
      });

      // Register file usage
      await StorageDbRepository.registerFileUsage({
        referenceTable: "students",
        referenceId: student.id,
        usageType: "avatar",
        filePath: bucketPath,
      });
    }
    logger.info("Student avatars seeded and registered successfully.");
  } catch (error) {
    logger.error("Failed to seed student avatars:", error);
  }

  logger.info("System students seeded.");
  return [student1, student2];
}
