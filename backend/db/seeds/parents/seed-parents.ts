import {
  ALL_PARENT_STATUSES,
  cycleAtIndex,
  linkAvatarsToEntities,
  loadSeedConfig,
  PARENT_AVATAR_FILES,
  pickTimezoneForIndex,
  type SeedConfig,
  shouldSeedExtendedFiles,
} from "@/backend/db/seeds/lib";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import { logger } from "@/backend/lib/logger";
import { PersonaSeedService } from "@/backend/services/seed/persona-seed.service";
import type { UserSelectType } from "@/backend/types";

export async function seedOrGet(users: UserSelectType[], config?: SeedConfig) {
  logger.info("Seeding system parents...");
  const seedConfig = config ?? loadSeedConfig();

  const parentUsers = users.filter(
    u => u.email === "parent@siraj.local" || /^parent-\d+@seed\.siraj\.local$/.test(u.email)
  );

  if (parentUsers.length === 0) {
    throw new Error("No parent users found in seed data.");
  }

  const results = await Promise.all(
    parentUsers.map((user, i) => {
      const timezone = i === 0 ? IanaTimezone.Africa_Cairo : pickTimezoneForIndex(i);
      const status = cycleAtIndex(ALL_PARENT_STATUSES, i);
      return PersonaSeedService.seedParentProfile({
        userId: user.id,
        timezone,
        status,
      });
    })
  );

  if (shouldSeedExtendedFiles(seedConfig)) {
    await linkAvatarsToEntities({
      assetDir: "avatars/parents",
      bucketDir: "public/avatars/parents",
      poolFiles: PARENT_AVATAR_FILES,
      referenceTable: "parents",
      entities: results,
    });
  }

  logger.info(`System parents seeded (${results.length} total).`);
  return results;
}
