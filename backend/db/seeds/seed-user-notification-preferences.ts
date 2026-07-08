import { db } from "@/backend/db/drizzleDb";
import { userNotificationPreferences } from "@/backend/db/schema/communications";
import logger from "@/backend/lib/logger";
import type { UserSelectType } from "@/backend/types";
import {
  ALL_NOTIFICATION_CHANNELS,
  ALL_NOTIFICATION_EVENT_TYPES,
  cycleAtIndex,
  loadSeedConfig,
  type SeedConfig,
} from "./lib";

export async function seedOrGet(usersList: UserSelectType[], config?: SeedConfig) {
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

  for (let userIndex = 0; userIndex < targetUsers.length; userIndex++) {
    const user = targetUsers[userIndex];
    const channel = cycleAtIndex(ALL_NOTIFICATION_CHANNELS, userIndex);
    const eventType = cycleAtIndex(ALL_NOTIFICATION_EVENT_TYPES, userIndex);

    const [inserted] = await db
      .insert(userNotificationPreferences)
      .values({
        userId: user.id,
        channel,
        eventType,
        enabled: userIndex % 5 !== 0,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          userNotificationPreferences.userId,
          userNotificationPreferences.channel,
          userNotificationPreferences.eventType,
        ],
        set: { enabled: userIndex % 5 !== 0, updatedAt: now },
      })
      .returning();
    results.push(inserted);
  }

  logger.info(`User notification preferences seeded (${results.length} rows).`);
  return results;
}
