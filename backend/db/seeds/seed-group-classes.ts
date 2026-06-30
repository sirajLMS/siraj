import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { groupClasses } from "@/backend/db/schema/group-class";
import logger from "@/backend/lib/logger";
import type { ClassInstanceEntity, StudentEntity } from "@/backend/types";
import type { SeedConfig } from "./lib";

export async function seedOrGet(
  classInstancesList: ClassInstanceEntity[],
  studentsList: StudentEntity[],
  _config?: SeedConfig
) {
  logger.info("Seeding system group classes...");
  if (!classInstancesList?.length) {
    throw new Error("No class instances available to link to group classes.");
  }
  if (!studentsList?.length) {
    throw new Error("No students available for group class enrollments.");
  }

  const results = [];

  for (const instance of classInstancesList.slice(0, 5)) {
    const [existing] = await db
      .select({ id: groupClasses.id, classInstanceId: groupClasses.classInstanceId, courseName: groupClasses.courseName })
      .from(groupClasses)
      .where(eq(groupClasses.classInstanceId, instance.id))
      .limit(1);

    if (existing) {
      results.push(existing);
      continue;
    }

    const now = new Date();
    const [inserted] = await db
      .insert(groupClasses)
      .values({
        classInstanceId: instance.id,
        courseName: `Course-${instance.id.slice(0, 8)}`,
        teacherName: "Seeded Teacher",
        classType: instance.classType,
        originalDate: instance.isRescheduled ? instance.scheduledStartAt : null,
        rescheduledDate: instance.isRescheduled ? now : null,
        timeSlot: `${instance.scheduledStartAt.toISOString().slice(11, 16)} - ${instance.scheduledEndAt.toISOString().slice(11, 16)}`,
        status: instance.isRescheduled ? "regular_rescheduled" : "regular_scheduled",
        auditRemark: instance.isRescheduled ? "Class rescheduled by system" : null,
        auditLoggedAt: now,
      })
      .returning();

    results.push(inserted);
  }

  logger.info(`System group classes seeded (${results.length} rows).`);
  return results;
}
