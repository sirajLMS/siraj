import { eq, sql } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { userNotificationPreferences } from "@/backend/db/schema";
import type { NotificationPreferenceUpdateInput } from "@/backend/types/notifications/notification-preferences.types";
import type { UserNotificationPreferenceSelectType } from "@/backend/types/users/userNotificationPreferences.types";

export namespace NotificationPreferencesRepository {
  export async function getByUserId(
    userId: string,
    tx?: DBTransaction
  ): Promise<UserNotificationPreferenceSelectType[]> {
    const q = queryDb(tx);
    return q.select().from(userNotificationPreferences).where(eq(userNotificationPreferences.userId, userId));
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
      await t.execute(sql`SELECT pg_advisory_xact_lock(hashtext('notification_prefs_batch_' || ${userId}::text))`);

      const now = new Date();
      const results: UserNotificationPreferenceSelectType[] = [];

      for (const input of inputs) {
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

        results.push(result);
      }

      return results;
    };

    return tx ? runner(tx) : db.transaction(runner);
  }
}
