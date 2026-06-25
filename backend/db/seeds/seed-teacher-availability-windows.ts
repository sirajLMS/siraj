import { and, eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { teacherAvailabilityWindows } from "@/backend/db/schema/teacher-availability";
import logger from "@/backend/lib/logger";
import type { TeacherEntity, TimezoneEntity } from "@/backend/types";
import {
  buildTeacherAvailabilityWindows,
  getAvailabilityEffectiveRange,
  loadSeedConfig,
  type SeedConfig,
} from "./lib";

export async function seedOrGet(
  teachersList: TeacherEntity[],
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

  for (let i = 0; i < teachersList.length; i++) {
    const teacher = teachersList[i];
    const tz = timezones.find(t => t.ianaId === teacher.timezone) ?? timezones[0];
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
            timezone: teacher.timezone,
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
          timezone: teacher.timezone,
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
