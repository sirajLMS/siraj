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
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import logger from "@/backend/lib/logger";
import { PersonaBootstrapService } from "@/backend/services/system/persona-bootstrap.service";
import type { TimezoneEntity, UserSelectType } from "@/backend/types";

function resolveTimezone(timezones: TimezoneEntity[], ianaId: string): TimezoneEntity {
  const match = timezones.find(t => t.ianaId === ianaId);
  if (!match) {
    throw new Error(`Timezone not found: ${ianaId}`);
  }
  return match;
}

export async function seedOrGet(users: UserSelectType[], timezones: TimezoneEntity[], config?: SeedConfig) {
  logger.info("Seeding system teachers...");
  const seedConfig = config ?? loadSeedConfig();

  const defaultTimezone = timezones.find(t => t.ianaId === IanaTimezone.UTC) || timezones[0];
  if (!defaultTimezone) {
    throw new Error("No timezones found in seed data.");
  }

  const teacherUsers = users.filter(
    u => u.email === "teacher@siraj.local" || /^teacher-\d+@seed\.siraj\.local$/.test(u.email)
  );

  if (teacherUsers.length === 0) {
    throw new Error("No teacher users found in seed data.");
  }

  const results = [];
  for (let i = 0; i < teacherUsers.length; i++) {
    const user = teacherUsers[i];
    const tzIana = i === 0 ? IanaTimezone.UTC : pickTimezoneForIndex(i);
    resolveTimezone(timezones, tzIana);
    const status = i === 0 ? ALL_ACCOUNT_STATUSES[0] : cycleAtIndex(ALL_ACCOUNT_STATUSES, i);

    // Pass the hourlyRate and rateCurrency cleanly via service bootstrap
    const rate = (50 + i * 15).toString();
    const teacher = await PersonaBootstrapService.upsertTeacherProfile({
      userId: user.id,
      timezone: tzIana,
      status,
      hourlyRate: rate,
      rateCurrency: CurrencyCode.SAR,
    });

    results.push(teacher);
  }

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
