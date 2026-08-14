import { findAdminUser, loadSeedConfig, type SeedConfig } from "@/backend/db/seeds/lib";
import { logger } from "@/backend/lib/logger";
import { DstMigrationService } from "@/backend/services";
import type { UserSelectType } from "@/backend/types";

export async function seedOrGet(usersList: UserSelectType[], config?: SeedConfig) {
  logger.info("Seeding DST migration runs...");
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableExtendedScheduling) {
    return [];
  }

  const adminUser = findAdminUser(usersList);
  if (!adminUser) {
    logger.warn("Admin user not found; skipping DST migration run seeding.");
    return [];
  }

  const existing = await DstMigrationService.findMigrationRunByUserId(adminUser.id);
  if (existing) {
    logger.info("DST migration run already seeded.");
    return [existing];
  }

  const inserted = await DstMigrationService.createMigrationRun(adminUser.id, 60, "Seed DST migration demo run");

  logger.info("DST migration runs seeded.");
  return [inserted];
}
