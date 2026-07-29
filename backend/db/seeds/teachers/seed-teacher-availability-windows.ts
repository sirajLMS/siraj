import {
  buildTeacherAvailabilityWindows,
  getAvailabilityEffectiveRange,
  loadSeedConfig,
  type SeedConfig,
} from "@/backend/db/seeds/lib";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import logger from "@/backend/lib/logger";
import { TeacherAvailabilitySeedService } from "@/backend/services/seed/teacher-availability-seed.service";
import type { TeacherEntity, TimezoneEntity, UserSelectType } from "@/backend/types";

export async function seedOrGet(
  teachersList: TeacherEntity[],
  usersList: UserSelectType[],
  timezones: TimezoneEntity[],
  config?: SeedConfig
) {
  logger.info("Seeding teacher availability windows...");
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableExtendedScheduling || !teachersList?.length) {
    return [];
  }

  const { from, until } = getAvailabilityEffectiveRange(seedConfig);
  const userTimezoneById = new Map(usersList.map(u => [u.id, u.timezone]));
  const inputs = [];

  for (let i = 0; i < teachersList.length; i++) {
    const teacher = teachersList[i];
    const teacherTimezone = userTimezoneById.get(teacher.userId) ?? IanaTimezone.UTC;
    const tz = timezones.find(t => t.ianaId === teacherTimezone) ?? timezones[0];
    const windows = buildTeacherAvailabilityWindows(i);

    for (const window of windows) {
      inputs.push({
        teacherId: teacher.id,
        dayOfWeek: window.dayOfWeek,
        startTime: window.startTime,
        endTime: window.endTime,
        timezone: teacherTimezone,
        timezoneId: tz?.id ?? null,
        effectiveFrom: from,
        effectiveUntil: until,
      });
    }
  }

  const results = await TeacherAvailabilitySeedService.seedManyAvailabilityWindows(inputs);
  logger.info(`Teacher availability windows seeded (${results.length} rows).`);
  return results;
}
