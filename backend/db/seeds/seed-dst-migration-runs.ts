import { eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { dstMigrationRuns } from "@/backend/db/schema/scheduling";
import logger from "@/backend/lib/logger";
import type { UserEntity } from "@/backend/types";
import { findAdminUser, loadSeedConfig, type SeedConfig } from "./lib";

export async function seedOrGet(usersList: UserEntity[], config?: SeedConfig) {
  logger.info("Seeding DST migration runs...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableExtendedScheduling) {
    return [];
  }

  const adminUser = findAdminUser(usersList);
  if (!adminUser) {
    logger.warn("Admin user not found; skipping DST migration run seeding.");
    return [];
  }

  const [existing] = await db
    .select()
    .from(dstMigrationRuns)
    .where(eq(dstMigrationRuns.runByUserId, adminUser.id))
    .limit(1);

  if (existing) {
    logger.info("DST migration run already seeded.");
    return [existing];
  }

  const [inserted] = await db
    .insert(dstMigrationRuns)
    .values({
      runByUserId: adminUser.id,
      offsetMinutes: 60,
      description: "Seed DST migration demo run",
      createdAt: now,
    })
    .returning();

  logger.info("DST migration runs seeded.");
  return [inserted];
}
