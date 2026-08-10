import {
  ALL_NOTIFICATION_CHANNELS,
  ALL_NOTIFICATION_EVENT_TYPES,
  cycleAtIndex,
  loadSeedConfig,
  type SeedConfig,
  STUDENT_USER_EMAIL,
  SUPERVISOR_USER_EMAIL,
} from "@/backend/db/seeds/lib";
import { NotificationEventType } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { NotificationPreferencesService } from "@/backend/services/notification/notification-preferences.service";
import type { UserSelectType } from "@/backend/types";
import {
  STUDENT_NOTIFICATION_EVENTS,
  SUPERVISOR_NOTIFICATION_EVENTS,
} from "@/shared/constants/notification-event-allowlists";

function eventTypesForUser(email: string): readonly NotificationEventType[] {
  if (email === STUDENT_USER_EMAIL || /^student-\d+@seed\.siraj\.local$/.test(email)) {
    return STUDENT_NOTIFICATION_EVENTS.map(key => NotificationEventType[key]);
  }
  if (email === SUPERVISOR_USER_EMAIL) {
    return SUPERVISOR_NOTIFICATION_EVENTS.map(key => NotificationEventType[key]);
  }
  return ALL_NOTIFICATION_EVENT_TYPES;
}

export async function seedOrGet(usersList: UserSelectType[], config?: SeedConfig) {
  logger.info("Seeding user notification preferences...");
  const seedConfig = config ?? loadSeedConfig();

  if (!seedConfig.enableCommunications || !usersList?.length) {
    return [];
  }

  const targetUsers =
    seedConfig.profile === "standard"
      ? usersList.filter(u => u.email.includes("@seed.siraj.local") || u.email.includes("@siraj.local"))
      : usersList.slice(0, 3);

  const results = await Promise.all(
    targetUsers.map(async (user, userIndex) => {
      const channel = cycleAtIndex(ALL_NOTIFICATION_CHANNELS, userIndex);
      const allowlist = eventTypesForUser(user.email);
      const eventType = cycleAtIndex(allowlist, userIndex);

      return NotificationPreferencesService.upsertManyPreferences(user.id, [
        {
          channel,
          eventType,
          enabled: userIndex % 5 !== 0,
        },
      ]);
    })
  );
  const inserted = results.flat();

  logger.info(`User notification preferences seeded (${inserted.length} rows).`);
  return inserted;
}
