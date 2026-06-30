import { and, eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { groupClassEnrollments } from "@/backend/db/schema/group-class";
import logger from "@/backend/lib/logger";
import type { StudentEntity } from "@/backend/types";
import type { SeedConfig } from "./lib";

type GroupClassEntity = { id: string; classInstanceId: string };

export async function seedOrGet(
  groupClassesList: GroupClassEntity[],
  studentsList: StudentEntity[],
  _config?: SeedConfig
) {
  logger.info("Seeding system group class enrollments...");
  if (!groupClassesList?.length) {
    logger.info("No group classes available to link enrollments. Skipping.");
    return [];
  }
  if (!studentsList?.length) {
    logger.info("No students available for group class enrollments. Skipping.");
    return [];
  }

  const results = [];

  for (const groupClass of groupClassesList) {
    const studentsForClass = studentsList.slice(0, 3);

    for (const student of studentsForClass) {
      const [existing] = await db
        .select({ id: groupClassEnrollments.id })
        .from(groupClassEnrollments)
        .where(
          and(eq(groupClassEnrollments.groupClassId, groupClass.id), eq(groupClassEnrollments.studentId, student.id))
        )
        .limit(1);

      if (existing) continue;

      const [inserted] = await db
        .insert(groupClassEnrollments)
        .values({
          groupClassId: groupClass.id,
          studentId: student.id,
          studentIdNumber: `STU-${student.id.slice(0, 6)}`,
          attendanceStatus: "pending",
        })
        .returning();

      results.push(inserted);
    }
  }

  logger.info(`System group class enrollments seeded (${results.length} rows).`);
  return results;
}
