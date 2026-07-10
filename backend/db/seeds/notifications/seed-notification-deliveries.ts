import {
  ALL_NOTIFICATION_CHANNELS,
  ALL_NOTIFICATION_DELIVERY_STATUSES,
  ALL_NOTIFICATION_EVENT_TYPES,
  cycleAtIndex,
  getFakerForIndex,
  loadSeedConfig,
  type SeedConfig,
} from "@/backend/db/seeds/lib";
import { NotificationDeliveryStatus } from "@/backend/enum";
import logger from "@/backend/lib/logger";
import { CommunicationService } from "@/backend/services/communication/communication.service";
import type { UserSelectType } from "@/backend/types";

type DeviceTokenRow = { id: string; userId: string };

function deliveryTimestamps(status: NotificationDeliveryStatus, now: Date) {
  return {
    sentAt: status === NotificationDeliveryStatus.PENDING || status === NotificationDeliveryStatus.FAILED ? null : now,
    deliveredAt:
      status === NotificationDeliveryStatus.DELIVERED || status === NotificationDeliveryStatus.OPENED ? now : null,
    failedAt: status === NotificationDeliveryStatus.FAILED ? now : null,
    failureReason: status === NotificationDeliveryStatus.FAILED ? "Seed simulated failure" : null,
  };
}

export async function seedOrGet(usersList: UserSelectType[], deviceTokensList: DeviceTokenRow[], config?: SeedConfig) {
  logger.info("Seeding notification deliveries...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableCommunications || !usersList?.length) {
    return [];
  }

  const tokenByUser = new Map(deviceTokensList.map(t => [t.userId, t.id]));
  const sampleUsers = seedConfig.profile === "standard" ? usersList.slice(0, 10) : usersList.slice(0, 2);
  const inputs = [];

  for (let i = 0; i < sampleUsers.length; i++) {
    const user = sampleUsers[i];
    const faker = getFakerForIndex(seedConfig.fakerSeed, 11000 + i);
    const status = cycleAtIndex(ALL_NOTIFICATION_DELIVERY_STATUSES, i);
    const timestamps = deliveryTimestamps(status, now);

    inputs.push({
      userId: user.id,
      deviceTokenId: tokenByUser.get(user.id) ?? null,
      channel: cycleAtIndex(ALL_NOTIFICATION_CHANNELS, i),
      eventType: cycleAtIndex(ALL_NOTIFICATION_EVENT_TYPES, i),
      status,
      title: "Class reminder",
      body: faker.lorem.sentence(),
      ...timestamps,
      createdAt: now,
      updatedAt: now,
    });
  }

  const results = await CommunicationService.createManySeedDeliveries(inputs);
  logger.info(`Notification deliveries seeded (${results.length} rows).`);
  return results;
}
