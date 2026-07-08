import { db } from "@/backend/db/drizzleDb";
import { userDeviceTokens } from "@/backend/db/schema/communications";
import logger from "@/backend/lib/logger";
import type { UserSelectType } from "@/backend/types";
import { ALL_DEVICE_PLATFORMS, cycleAtIndex, getFakerForIndex, loadSeedConfig, type SeedConfig } from "./lib";

export async function seedOrGet(usersList: UserSelectType[], config?: SeedConfig) {
  logger.info("Seeding user device tokens...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableCommunications || !usersList?.length) {
    return [];
  }

  const targetUsers = usersList.filter(
    u => u.email.startsWith("parent-") || u.email.startsWith("teacher-") || u.email.endsWith("@siraj.local")
  );
  const sample = seedConfig.profile === "standard" ? targetUsers : targetUsers.slice(0, 2);
  const results = [];

  for (let i = 0; i < sample.length; i++) {
    const user = sample[i];
    const faker = getFakerForIndex(seedConfig.fakerSeed, 10000 + i);
    const token = `seed_device_token_${user.id.slice(0, 8)}_${faker.string.alphanumeric(16)}`;

    const [inserted] = await db
      .insert(userDeviceTokens)
      .values({
        userId: user.id,
        token,
        platform: cycleAtIndex(ALL_DEVICE_PLATFORMS, i),
        deviceName: faker.internet.userAgent(),
        isActive: true,
        lastUsedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: userDeviceTokens.token,
        set: { isActive: true, lastUsedAt: now, updatedAt: now },
      })
      .returning();
    results.push(inserted);
  }

  logger.info(`User device tokens seeded (${results.length} rows).`);
  return results;
}
