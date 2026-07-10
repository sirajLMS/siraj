import {
  ALL_DEVICE_PLATFORMS,
  cycleAtIndex,
  getFakerForIndex,
  loadSeedConfig,
  type SeedConfig,
} from "@/backend/db/seeds/lib";
import logger from "@/backend/lib/logger";
import { NotificationDeviceService } from "@/backend/services/communication/notification-device.service";
import type { UserSelectType } from "@/backend/types";

export async function seedOrGet(usersList: UserSelectType[], config?: SeedConfig) {
  logger.info("Seeding user device tokens...");
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableCommunications || !usersList?.length) {
    return [];
  }

  const targetUsers = usersList.filter(
    u => u.email.startsWith("parent-") || u.email.startsWith("teacher-") || u.email.endsWith("@siraj.local")
  );
  const sample = seedConfig.profile === "standard" ? targetUsers : targetUsers.slice(0, 2);
  const entries = [];

  for (let i = 0; i < sample.length; i++) {
    const user = sample[i];
    const faker = getFakerForIndex(seedConfig.fakerSeed, 10000 + i);
    const token = `seed_device_token_${user.id.slice(0, 8)}_${faker.string.alphanumeric(16)}`;

    entries.push({
      userId: user.id,
      input: {
        token,
        platform: cycleAtIndex(ALL_DEVICE_PLATFORMS, i),
        deviceName: faker.internet.userAgent(),
      },
    });
  }

  const results = await NotificationDeviceService.registerManyDeviceTokens(entries);

  logger.info(`User device tokens seeded (${results.length} rows).`);
  return results;
}
