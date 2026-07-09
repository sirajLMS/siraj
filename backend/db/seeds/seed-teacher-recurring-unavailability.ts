import { and, eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { teacherRecurringUnavailability } from "@/backend/db/schema/teacher-availability";
import {
  buildLunchUnavailability,
  getAvailabilityEffectiveRange,
  loadSeedConfig,
  type SeedConfig,
  shouldSeedLunchBlock,
} from "@/backend/db/seeds/lib";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import logger from "@/backend/lib/logger";
import type { TeacherEntity, TimezoneEntity, UserSelectType } from "@/backend/types";

export async function seedOrGet(
  teachersList: TeacherEntity[],
  usersList: UserSelectType[],
  timezones: TimezoneEntity[],
  config?: SeedConfig
) {
  logger.info("Seeding teacher recurring unavailability...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableExtendedScheduling || !teachersList?.length) {
    return [];
  }

  const { from, until } = getAvailabilityEffectiveRange(seedConfig);
  const lunch = buildLunchUnavailability();
  const results = [];

  const userTimezoneById = new Map(usersList.map(u => [u.id, u.timezone]));

  for (let i = 0; i < teachersList.length; i++) {
    if (!shouldSeedLunchBlock(i)) continue;

    const teacher = teachersList[i];
    const teacherTimezone = userTimezoneById.get(teacher.userId) ?? IanaTimezone.UTC;
    const tz = timezones.find(t => t.ianaId === teacherTimezone) ?? timezones[0];

    const [existing] = await db
      .select()
      .from(teacherRecurringUnavailability)
      .where(
        and(
          eq(teacherRecurringUnavailability.teacherId, teacher.id),
          eq(teacherRecurringUnavailability.dayOfWeek, lunch.dayOfWeek)
        )
      )
      .limit(1);

    if (existing) {
      results.push(existing);
      continue;
    }

    const [inserted] = await db
      .insert(teacherRecurringUnavailability)
      .values({
        teacherId: teacher.id,
        dayOfWeek: lunch.dayOfWeek,
        startTime: lunch.startTime,
        endTime: lunch.endTime,
        timezone: teacherTimezone,
        timezoneId: tz?.id ?? null,
        effectiveFrom: from,
        effectiveUntil: until,
        reason: "Lunch break",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    results.push(inserted);
  }

  logger.info(`Teacher recurring unavailability seeded (${results.length} rows).`);
  return results;
}
