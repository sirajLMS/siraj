import { and, eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { teacherAvailabilityWindows } from "@/backend/db/schema/teacher-availability";
import {
  buildTeacherAvailabilityWindows,
  getAvailabilityEffectiveRange,
  loadSeedConfig,
  type SeedConfig,
} from "@/backend/db/seeds/lib";
import { IanaTimezone } from "@/backend/enum/timezone.enum";
import logger from "@/backend/lib/logger";
import type { TeacherEntity, TimezoneEntity, UserSelectType } from "@/backend/types";

export async function seedOrGet(
  teachersList: TeacherEntity[],
  usersList: UserSelectType[],
  timezones: TimezoneEntity[],
  config?: SeedConfig
) {
  logger.info("Seeding teacher availability windows...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableExtendedScheduling || !teachersList?.length) {
    return [];
  }

  const { from, until } = getAvailabilityEffectiveRange(seedConfig);
  const results = [];

  const userTimezoneById = new Map(usersList.map(u => [u.id, u.timezone]));

  for (let i = 0; i < teachersList.length; i++) {
    const teacher = teachersList[i];
    const teacherTimezone = userTimezoneById.get(teacher.userId) ?? IanaTimezone.UTC;
    const tz = timezones.find(t => t.ianaId === teacherTimezone) ?? timezones[0];
    const windows = buildTeacherAvailabilityWindows(i);

    for (const window of windows) {
      const [existing] = await db
        .select()
        .from(teacherAvailabilityWindows)
        .where(
          and(
            eq(teacherAvailabilityWindows.teacherId, teacher.id),
            eq(teacherAvailabilityWindows.dayOfWeek, window.dayOfWeek)
          )
        )
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(teacherAvailabilityWindows)
          .set({
            startTime: window.startTime,
            endTime: window.endTime,
            timezone: teacherTimezone,
            timezoneId: tz?.id ?? null,
            effectiveFrom: from,
            effectiveUntil: until,
            updatedAt: now,
          })
          .where(eq(teacherAvailabilityWindows.id, existing.id))
          .returning();
        results.push(updated);
        continue;
      }

      const [inserted] = await db
        .insert(teacherAvailabilityWindows)
        .values({
          teacherId: teacher.id,
          dayOfWeek: window.dayOfWeek,
          startTime: window.startTime,
          endTime: window.endTime,
          timezone: teacherTimezone,
          timezoneId: tz?.id ?? null,
          effectiveFrom: from,
          effectiveUntil: until,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      results.push(inserted);
    }
  }

  logger.info(`Teacher availability windows seeded (${results.length} rows).`);
  return results;
}
