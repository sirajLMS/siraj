import { and, eq } from "drizzle-orm";
import type { QueryDbHandle } from "@/backend/db";
import { acquireDeviceTokenLock, acquirePreferenceLock } from "@/backend/db/repo/notifications/notification-db.helpers";
import { userDeviceTokens, userNotificationPreferences } from "@/backend/db/schema";
import type { NotificationChannel, NotificationEventType } from "@/backend/enum";
import type {
  DBTransaction,
  NotificationPreferenceUpdateInput,
  RegisterDeviceTokenInput,
  UserDeviceTokenSelectType,
  UserNotificationPreferenceSelectType,
} from "@/backend/types";

export async function registerDeviceTokenRunner(
  t: DBTransaction,
  userId: string,
  input: RegisterDeviceTokenInput
): Promise<UserDeviceTokenSelectType> {
  await acquireDeviceTokenLock(t, userId);
  const now = new Date();

  const [token] = await t
    .insert(userDeviceTokens)
    .values({
      userId,
      token: input.token,
      platform: input.platform,
      deviceName: input.deviceName ?? null,
      isActive: true,
      lastUsedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: userDeviceTokens.token,
      set: {
        userId,
        platform: input.platform,
        deviceName: input.deviceName ?? null,
        isActive: true,
        lastUsedAt: now,
        updatedAt: now,
      },
    })
    .returning();

  return token;
}

export async function deactivateDeviceTokenRunner(
  t: DBTransaction,
  userId: string,
  token: string
): Promise<UserDeviceTokenSelectType | null> {
  await acquireDeviceTokenLock(t, userId);
  const now = new Date();

  const updated = await t
    .update(userDeviceTokens)
    .set({
      isActive: false,
      updatedAt: now,
    })
    .where(and(eq(userDeviceTokens.userId, userId), eq(userDeviceTokens.token, token)))
    .returning();

  return updated.length > 0 ? updated[0] : null;
}

export async function getActiveDeviceTokens(
  q: QueryDbHandle | DBTransaction,
  userId: string
): Promise<UserDeviceTokenSelectType[]> {
  const rows = await q
    .select()
    .from(userDeviceTokens)
    .where(and(eq(userDeviceTokens.userId, userId), eq(userDeviceTokens.isActive, true)));

  return rows;
}

export async function getPreferenceByKey(
  q: QueryDbHandle | DBTransaction,
  userId: string,
  channel: NotificationChannel,
  eventType: NotificationEventType
): Promise<UserNotificationPreferenceSelectType | null> {
  const results = await q
    .select()
    .from(userNotificationPreferences)
    .where(
      and(
        eq(userNotificationPreferences.userId, userId),
        eq(userNotificationPreferences.channel, channel),
        eq(userNotificationPreferences.eventType, eventType)
      )
    )
    .limit(1);

  return results[0] ?? null;
}

export async function setPreferenceRunner(
  t: DBTransaction,
  userId: string,
  input: NotificationPreferenceUpdateInput
): Promise<UserNotificationPreferenceSelectType> {
  await acquirePreferenceLock(t, userId, input.channel, input.eventType);

  const now = new Date();

  const [result] = await t
    .insert(userNotificationPreferences)
    .values({
      userId,
      channel: input.channel,
      eventType: input.eventType,
      enabled: input.enabled,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        userNotificationPreferences.userId,
        userNotificationPreferences.channel,
        userNotificationPreferences.eventType,
      ],
      set: {
        enabled: input.enabled,
        updatedAt: now,
      },
    })
    .returning();

  return result;
}
