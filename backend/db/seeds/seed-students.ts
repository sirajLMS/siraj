import { db } from "@/backend/db/drizzleDb";
import { students } from "@/backend/db/schema/students";
import logger from "@/backend/lib/logger";
import type { ParentEntity, TeacherEntity } from "@/backend/types";

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

  const [insertedStudent] = await db
    .insert(students)
    .values({
      parentId: defaultParent.id,
      primaryTeacherId: defaultTeacher.id,
      name: "Demo Student",
      status: "REGULAR",
      classesTotal: 10,
      classesRemaining: 5,
      version: 1,
      idempotencyKey: "demo_student_1",
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: students.idempotencyKey,
      set: {
        name: "Demo Student",
        status: "REGULAR",
        updatedAt: now,
      },
    })
    .returning();

  logger.info("System students seeded.");
  return [insertedStudent];
}
