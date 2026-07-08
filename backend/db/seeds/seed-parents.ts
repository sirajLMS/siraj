import { db } from "@/backend/db/drizzleDb";
import { parents } from "@/backend/db/schema/parents";
import logger from "@/backend/lib/logger";
import type { UserSelectType } from "@/backend/types";
import {
  ALL_PARENT_STATUSES,
  cycleAtIndex,
  getAvatarFileName,
  loadSeedConfig,
  pickTimezoneForIndex,
  type SeedConfig,
  seedEntityFile,
  shouldSeedExtendedFiles,
} from "./lib";

async function upsertParent(userId: string, timezone: string, status: string, now: Date) {
  const [insertedParent] = await db
    .insert(parents)
    .values({
      userId,
      status,
      timezone,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: parents.userId,
      set: {
        status,
        timezone,
        updatedAt: now,
      },
    })
    .returning();

  return insertedParent;
}

export async function seedOrGet(users: UserSelectType[], config?: SeedConfig) {
  logger.info("Seeding system parents...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  const parentUsers = users.filter(
    u => u.email === "parent@siraj.local" || /^parent-\d+@seed\.siraj\.local$/.test(u.email)
  );

  if (parentUsers.length === 0) {
    throw new Error("No parent users found in seed data.");
  }

  const results = [];
  for (let i = 0; i < parentUsers.length; i++) {
    const user = parentUsers[i];
    const timezone = i === 0 ? "Africa/Cairo" : pickTimezoneForIndex(i);
    const status = cycleAtIndex(ALL_PARENT_STATUSES, i);
    const parent = await upsertParent(user.id, timezone, status, now);

    if (shouldSeedExtendedFiles(seedConfig)) {
      try {
        const avatarFile = getAvatarFileName(i, 4);
        await seedEntityFile({
          assetRelativePath: `avatars/parents/${avatarFile}`,
          bucketPath: `public/avatars/parents/${avatarFile}`,
          referenceTable: "parents",
          referenceId: parent.id,
          usageType: "avatar",
          ensureParentDirs: ["public/avatars/parents"],
        });
      } catch (error) {
        logger.error(`Failed to seed parent avatar for ${parent.id}:`, error);
      }
    }

    results.push(parent);
  }

  logger.info(`System parents seeded (${results.length} total).`);
  return results;
}
