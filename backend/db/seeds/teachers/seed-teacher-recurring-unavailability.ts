import {
  buildLunchUnavailability,
  getAvailabilityEffectiveRange,
  loadSeedConfig,
  type SeedConfig,
  shouldSeedLunchBlock,
} from "@/backend/db/seeds/lib";
import { logger } from "@/backend/lib/logger";
import { TeacherAvailabilitySeedService } from "@/backend/services";
import type { TeacherSelectType, TimezoneSelectType, UserSelectType } from "@/backend/types";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

export async function seedOrGet(
  teachersList: TeacherSelectType[],
  usersList: UserSelectType[],
  timezones: TimezoneSelectType[],
  config?: SeedConfig
) {
  logger.info("Seeding teacher recurring unavailability...");
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableExtendedScheduling || !teachersList?.length) {
    return [];
  }

  const { from, until } = getAvailabilityEffectiveRange(seedConfig);
  const lunch = buildLunchUnavailability();
  const userTimezoneById = new Map(usersList.map(u => [u.id, u.timezone]));

  const insertions = await teachersList.reduce<
    Promise<Awaited<ReturnType<typeof TeacherAvailabilitySeedService.seedRecurringUnavailabilityIfMissing>>[]>
  >(async (prev, teacher, i) => {
    const acc = await prev;
    if (!shouldSeedLunchBlock(i)) return acc;

    const teacherTimezone = userTimezoneById.get(teacher.userId) ?? IanaTimezone.UTC;
    const tz = timezones.find(t => t.ianaId === teacherTimezone) ?? timezones[0];

    const res = await TeacherAvailabilitySeedService.seedRecurringUnavailabilityIfMissing({
      teacherId: teacher.id,
      dayOfWeek: lunch.dayOfWeek,
      startTime: lunch.startTime,
      endTime: lunch.endTime,
      timezone: teacherTimezone,
      timezoneId: tz?.id ?? null,
      effectiveFrom: from,
      effectiveUntil: until,
      reason: "Lunch break",
    });
    return [...acc, res];
  }, Promise.resolve([]));
  const results = insertions;

  logger.info(`Teacher recurring unavailability seeded (${results.length} rows).`);
  return results;
}
