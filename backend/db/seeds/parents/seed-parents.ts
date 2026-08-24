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
import { logger } from "@/backend/lib/logger";
import { PersonaSeedService } from "@/backend/services";
import type { UserSelectType } from "@/backend/types";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

export async function seedOrGet(users: UserSelectType[], config?: SeedConfig) {
  logger.info("Seeding system parents...");
  const seedConfig = config ?? loadSeedConfig();

  const parentUsers = users.filter(
    u => u.email === "parent@siraj.local" || /^parent-\d+@seed\.siraj\.local$/.test(u.email)
  );

  if (parentUsers.length === 0) {
    throw new Error("No parent users found in seed data.");
  }

  const results = await parentUsers.reduce<Promise<Awaited<ReturnType<typeof PersonaSeedService.seedParentProfile>>[]>>(
    async (prev, user, i) => {
      const acc = await prev;
      const timezone = i === 0 ? IanaTimezone.Africa_Cairo : pickTimezoneForIndex(i);
      const status = cycleAtIndex(ALL_PARENT_STATUSES, i);
      const row = await PersonaSeedService.seedParentProfile({
        userId: user.id,
        timezone,
        status,
      });
      return [...acc, row];
    },
    Promise.resolve([])
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
