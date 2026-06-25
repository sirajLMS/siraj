import { db } from "@/backend/db/drizzleDb";
import { userNotificationPreferences } from "@/backend/db/schema/communications";
import logger from "@/backend/lib/logger";
import type { UserEntity } from "@/backend/types";
import { NotificationChannel, NotificationEventType } from "@/shared/lib/enum";
import { loadSeedConfig, type SeedConfig } from "./lib";

const DEFAULT_CHANNELS = [NotificationChannel.EMAIL, NotificationChannel.ON_APP] as const;
const DEFAULT_EVENTS = [
  NotificationEventType.CLASS_REMINDER,
  NotificationEventType.INVOICE_GENERATED,
  NotificationEventType.COMPLAINT_RESPONSE,
] as const;

export async function seedOrGet(usersList: UserEntity[], config?: SeedConfig) {
  logger.info("Seeding user notification preferences...");
  const now = new Date();
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableCommunications || !usersList?.length) {
    return [];
  }

  const targetUsers =
    seedConfig.profile === "standard"
      ? usersList.filter(u => u.email.includes("@seed.siraj.local") || u.email.includes("@siraj.local"))
      : usersList.slice(0, 3);

  const results = [];

  for (const user of targetUsers) {
    for (const channel of DEFAULT_CHANNELS) {
      for (const eventType of DEFAULT_EVENTS) {
        const [inserted] = await db
          .insert(userNotificationPreferences)
          .values({
            userId: user.id,
            channel,
            eventType,
            enabled: true,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: [
              userNotificationPreferences.userId,
              userNotificationPreferences.channel,
              userNotificationPreferences.eventType,
            ],
            set: { enabled: true, updatedAt: now },
          })
          .returning();
        results.push(inserted);
      }
    }
  }

  logger.info(`User notification preferences seeded (${results.length} rows).`);
  return results;
}
