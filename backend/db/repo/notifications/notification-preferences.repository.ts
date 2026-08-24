import { and, eq, inArray, sql } from "drizzle-orm";
import { db, queryDb } from "@/backend/db";
import { acquireAdvisoryLock } from "@/backend/db/repo/shared";
import { userNotificationPreferences } from "@/backend/db/schema";
import type {
  DBTransaction,
  NotificationPreferenceUpdateInput,
  UserNotificationPreferenceSelectType,
} from "@/backend/types";

export namespace NotificationPreferencesRepository {
  export async function getByUserId(
    userId: string,
    tx?: DBTransaction
  ): Promise<UserNotificationPreferenceSelectType[]> {
    const q = queryDb(tx);
    return q.select().from(userNotificationPreferences).where(eq(userNotificationPreferences.userId, userId));
  }

  export async function getByUserIdAndChannel(
    userId: string,
    channel: string,
    tx?: DBTransaction
  ): Promise<UserNotificationPreferenceSelectType[]> {
    const q = queryDb(tx);
    return q
      .select()
      .from(userNotificationPreferences)
      .where(and(eq(userNotificationPreferences.userId, userId), eq(userNotificationPreferences.channel, channel)));
  }

  /**
   * Batch-fetch notification preferences for multiple users in a single query.
   * Returns a `Map<userId, UserNotificationPreferenceSelectType[]>` — users
   * with no stored prefs are absent from the map (caller treats missing as
   * all-enabled, matching the safe over-notify contract).
   */
  export async function getByUserIds(
    userIds: string[],
    tx?: DBTransaction
  ): Promise<Map<string, UserNotificationPreferenceSelectType[]>> {
    if (userIds.length === 0) {
      return new Map();
    }
    const q = queryDb(tx);
    const rows = await q
      .select()
      .from(userNotificationPreferences)
      .where(inArray(userNotificationPreferences.userId, userIds));

    const map = new Map<string, UserNotificationPreferenceSelectType[]>();
    for (const row of rows) {
      const existing = map.get(row.userId);
      if (existing) {
        existing.push(row);
      } else {
        map.set(row.userId, [row]);
      }
    }
    return map;
  }

  export async function batchUpsert(
    userId: string,
    inputs: NotificationPreferenceUpdateInput[],
    tx?: DBTransaction
  ): Promise<UserNotificationPreferenceSelectType[]> {
    if (inputs.length === 0) {
      return [];
    }

    const runner = async (t: DBTransaction) => {
      await acquireAdvisoryLock(t, `notification_prefs_batch_${userId}`);

      const now = new Date();

      const rows = inputs.map(input => ({
        userId,
        channel: input.channel,
        eventType: input.eventType,
        enabled: input.enabled,
        createdAt: now,
        updatedAt: now,
      }));

      const inserted = await t
        .insert(userNotificationPreferences)
        .values(rows)
        .onConflictDoUpdate({
          target: [
            userNotificationPreferences.userId,
            userNotificationPreferences.channel,
            userNotificationPreferences.eventType,
          ],
          set: {
            enabled: sql`EXCLUDED.enabled`,
            updatedAt: now,
          },
        })
        .returning();

      return inserted;
    };

    return tx ? runner(tx) : db.transaction(runner);
  }
}
