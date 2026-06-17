import { sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { recurringSchedules } from "@/backend/db/schema/scheduling";
import logger from "@/backend/lib/logger";
import type { StudentEntity, TeacherEntity } from "@/backend/types";

export async function seedOrGet(teachersList: TeacherEntity[], studentsList: StudentEntity[]) {
  logger.info("Seeding system classes (recurring schedules)...");
  const now = new Date();

  if (!teachersList || teachersList.length === 0) {
    throw new Error("No teachers available to link to classes.");
  }
  if (!studentsList || studentsList.length === 0) {
    throw new Error("No students available to link to classes.");
  }

  const defaultTeacher = teachersList[0];
  const defaultStudent = studentsList[0];

  // check if exists
  const [existing] = await db
    .select()
    .from(recurringSchedules)
    .where(
      sql`${recurringSchedules.teacherId} = ${defaultTeacher.id} AND ${recurringSchedules.studentId} = ${defaultStudent.id}`
    );

  if (existing) {
    logger.info("System classes already seeded.");
    return [existing];
  }

  const [insertedClass] = await db
    .insert(recurringSchedules)
    .values({
      teacherId: defaultTeacher.id,
      studentId: defaultStudent.id,
      durationMinutes: 60,
      defaultStartTime: "10:00:00",
      timezone: "UTC",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  logger.info("System classes seeded.");
  return [insertedClass];
}
