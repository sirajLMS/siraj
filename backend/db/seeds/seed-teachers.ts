import { db } from "@/backend/db/drizzleDb";
import { teachers } from "@/backend/db/schema/teachers";
import logger from "@/backend/lib/logger";
import type { TimezoneEntity, UserEntity } from "@/backend/types";

export async function seedOrGet(users: UserEntity[], timezones: TimezoneEntity[]) {
  logger.info("Seeding system teachers...");
  const now = new Date();

  // Find the teacher user
  const teacherUser = users.find(u => u.email === "teacher@siraj.local");
  if (!teacherUser) {
    throw new Error("Teacher user not found in seed data.");
  }

  // Assign to default timezone (UTC or first available)
  const defaultTimezone = timezones.find(t => t.ianaId === "UTC") || timezones[0];
  if (!defaultTimezone) {
    throw new Error("No timezones found in seed data.");
  }

  const [insertedTeacher] = await db
    .insert(teachers)
    .values({
      userId: teacherUser.id,
      status: "ACTIVATED",
      timezoneId: defaultTimezone.id,
      timezone: defaultTimezone.ianaId,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: teachers.userId,
      set: {
        status: "ACTIVATED",
        timezoneId: defaultTimezone.id,
        timezone: defaultTimezone.ianaId,
        updatedAt: now,
      },
    })
    .returning();

  logger.info("System teachers seeded.");
  return [insertedTeacher];
}
