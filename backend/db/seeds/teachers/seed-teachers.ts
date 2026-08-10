import {
  ALL_ACCOUNT_STATUSES,
  cycleAtIndex,
  linkAvatarsToEntities,
  loadSeedConfig,
  pickTimezoneForIndex,
  type SeedConfig,
  shouldSeedExtendedFiles,
  TEACHER_AVATAR_FILES,
} from "@/backend/db/seeds/lib";
import { CurrencyCode } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PersonaSeedService } from "@/backend/services/seed/persona-seed.service";
import type { TimezoneSelectType, UserSelectType } from "@/backend/types";

function resolveTimezone(timezones: TimezoneSelectType[], ianaId: string): TimezoneSelectType {
  const match = timezones.find(t => t.ianaId === ianaId);
  if (!match) {
    throw new Error(`Timezone not found: ${ianaId}`);
  }
  return match;
}

export async function seedOrGet(users: UserSelectType[], timezones: TimezoneSelectType[], config?: SeedConfig) {
  logger.info("Seeding system teachers...");
  const seedConfig = config ?? loadSeedConfig();

  const defaultTimezone = timezones.find(t => t.ianaId === "UTC") || timezones[0];
  if (!defaultTimezone) {
    throw new Error("No timezones found in seed data.");
  }

  const teacherUsers = users.filter(
    u => u.email === "teacher@siraj.local" || /^teacher-\d+@seed\.siraj\.local$/.test(u.email)
  );

  if (teacherUsers.length === 0) {
    throw new Error("No teacher users found in seed data.");
  }

  const results = await Promise.all(
    teacherUsers.map(async (user, i) => {
      const tzIana = i === 0 ? "UTC" : pickTimezoneForIndex(i);
      resolveTimezone(timezones, tzIana);
      const status = i === 0 ? ALL_ACCOUNT_STATUSES[0] : cycleAtIndex(ALL_ACCOUNT_STATUSES, i);

      // Pass the hourlyRate and rateCurrency cleanly via service bootstrap
      const rate = (50 + i * 15).toString();
      return PersonaSeedService.seedTeacherProfile({
        userId: user.id,
        timezone: tzIana,
        status,
        hourlyRate: rate,
        rateCurrency: CurrencyCode.SAR,
      });
    })
  );

  if (shouldSeedExtendedFiles(seedConfig)) {
    await linkAvatarsToEntities({
      assetDir: "avatars/teachers",
      bucketDir: "public/avatars/teachers",
      poolFiles: TEACHER_AVATAR_FILES,
      referenceTable: "teachers",
      entities: results,
    });
  }

  logger.info(`System teachers seeded (${results.length} total).`);
  return results;
}
