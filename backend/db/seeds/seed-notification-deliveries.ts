import { db } from "@/backend/db/drizzleDb";
import { notificationDeliveries } from "@/backend/db/schema/communications";
import logger from "@/backend/lib/logger";
import type { UserEntity } from "@/backend/types";
import { NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/shared/lib/enum";
import { getFakerForIndex, loadSeedConfig, type SeedConfig } from "./lib";

type DeviceTokenRow = { id: string; userId: string };

export async function seedOrGet(usersList: UserEntity[], deviceTokensList: DeviceTokenRow[], config?: SeedConfig) {
  logger.info("Seeding notification deliveries...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableCommunications || !usersList?.length) {
    return [];
  }

  const tokenByUser = new Map(deviceTokensList.map(t => [t.userId, t.id]));
  const sampleUsers = seedConfig.profile === "standard" ? usersList.slice(0, 10) : usersList.slice(0, 2);
  const statuses = [NotificationDeliveryStatus.DELIVERED, NotificationDeliveryStatus.FAILED] as const;
  const results = [];

  for (let i = 0; i < sampleUsers.length; i++) {
    const user = sampleUsers[i];
    const faker = getFakerForIndex(seedConfig.fakerSeed, 11000 + i);
    const status = statuses[i % statuses.length];

    const [inserted] = await db
      .insert(notificationDeliveries)
      .values({
        userId: user.id,
        deviceTokenId: tokenByUser.get(user.id) ?? null,
        channel: NotificationChannel.EMAIL,
        eventType: NotificationEventType.CLASS_REMINDER,
        status,
        title: "Class reminder",
        body: faker.lorem.sentence(),
        sentAt: status !== NotificationDeliveryStatus.FAILED ? now : null,
        deliveredAt: status === NotificationDeliveryStatus.DELIVERED ? now : null,
        failedAt: status === NotificationDeliveryStatus.FAILED ? now : null,
        failureReason: status === NotificationDeliveryStatus.FAILED ? "Seed simulated failure" : null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    results.push(inserted);
  }

  logger.info(`Notification deliveries seeded (${results.length} rows).`);
  return results;
}
