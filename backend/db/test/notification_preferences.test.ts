// cspell:ignore: notif
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { NotificationChannel, NotificationEventType } from "../../../lib/enum";
import { testLogger } from "../../../lib/testlogger";
import type { UserEntity, UserNotificationPreferenceSelectType } from "../../types";
import { db } from "../drizzleDb";
import { userNotificationPreferences, users } from "../schema";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function runInRollback(fn: (tx: DbTransaction) => Promise<void>): Promise<void> {
  let assertionError: unknown = null;
  try {
    await db.transaction(async tx => {
      try {
        await fn(tx);
      } catch (error) {
        assertionError = error;
      }
      tx.rollback();
    });
  } catch {
    // Ignore expected Drizzle transaction rollback error
  }
  if (assertionError) {
    throw assertionError;
  }
}

describe("User Notification Preferences", () => {
  beforeAll(async () => {
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'test_rls_user_notif') THEN
          CREATE ROLE test_rls_user_notif WITH LOGIN PASSWORD 'test_rls_pass';
        END IF;
      END
      $$;
      GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test_rls_user_notif;
      GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test_rls_user_notif;
    `);
  });

  afterAll(async () => {
    try {
      await db.execute(sql`
        REASSIGN OWNED BY test_rls_user_notif TO postgres;
        DROP OWNED BY test_rls_user_notif;
        DROP ROLE IF EXISTS test_rls_user_notif;
      `);
    } catch {
      testLogger.warn("Failed to drop RLS test role for notif");
    }
  });

  test("Can insert and retrieve preferences", async () => {
    testLogger.info("Testing preference insertion...");
    await runInRollback(async tx => {
      const now = new Date();
      const [user] = (await tx
        .insert(users)
        .values({
          name: "Test User",
          email: `user-${randomUUID()}@example.com`,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [UserEntity];

      await tx.insert(userNotificationPreferences).values({
        userId: user.id,
        channel: NotificationChannel.EMAIL,
        eventType: NotificationEventType.CLASS_REMINDER,
        enabled: false,
      });

      const [pref] = (await tx
        .select()
        .from(userNotificationPreferences)
        .where(
          and(
            eq(userNotificationPreferences.userId, user.id),
            eq(userNotificationPreferences.channel, NotificationChannel.EMAIL),
            eq(userNotificationPreferences.eventType, NotificationEventType.CLASS_REMINDER)
          )
        )) as UserNotificationPreferenceSelectType[];

      expect(pref).toBeDefined();
      expect(pref.enabled).toBe(false);
    });
    testLogger.info("Preference insertion test passed.");
  });

  test("Composite unique constraint prevents duplicate preferences", async () => {
    testLogger.info("Testing unique constraint on preferences...");
    await runInRollback(async tx => {
      const now = new Date();
      const [user] = (await tx
        .insert(users)
        .values({
          name: "Test User",
          email: `user-dup-${randomUUID()}@example.com`,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [UserEntity];

      await tx.insert(userNotificationPreferences).values({
        userId: user.id,
        channel: NotificationChannel.EMAIL,
        eventType: NotificationEventType.CLASS_REMINDER,
        enabled: true,
      });

      try {
        await tx.insert(userNotificationPreferences).values({
          userId: user.id,
          channel: NotificationChannel.EMAIL,
          eventType: NotificationEventType.CLASS_REMINDER,
          enabled: false,
        });
        expect(true).toBe(false); // Should fail
      } catch (error) {
        const err = error as Error & { cause?: { code?: string } };
        // Check for 23505 (unique_violation) in Postgres
        const message = err.message || "";
        const code = err.cause?.code || "";
        expect(message.includes("23505") || code === "23505").toBe(true);
      }
    });
    testLogger.info("Unique constraint test passed.");
  });

  test("RLS prevents users from seeing others' preferences", async () => {
    testLogger.info("Testing RLS on notification preferences...");
    await runInRollback(async tx => {
      const now = new Date();
      // Use different names and emails
      const [userA] = (await tx
        .insert(users)
        .values({ name: "UserA", email: `a-${randomUUID()}@x.com`, password: "p", createdAt: now, updatedAt: now })
        .returning()) as [UserEntity];
      const [userB] = (await tx
        .insert(users)
        .values({ name: "UserB", email: `b-${randomUUID()}@x.com`, password: "p", createdAt: now, updatedAt: now })
        .returning()) as [UserEntity];

      // User B creates a preference
      await tx.insert(userNotificationPreferences).values({
        userId: userB.id,
        channel: NotificationChannel.SMS,
        eventType: NotificationEventType.INVOICE_GENERATED,
        enabled: true,
      });

      // Switch to unprivileged role for RLS tests
      await tx.execute(sql`SET LOCAL ROLE test_rls_user_notif`);

      // Set session actor to User A
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userA.id}, true)`);

      // User A tries to select preferences
      const preferences = await tx.select().from(userNotificationPreferences);

      // Should be empty because User A has no preferences and cannot see User B's
      expect(preferences.length).toBe(0);

      // Set session actor to User B
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userB.id}, true)`);
      const bPreferences = await tx.select().from(userNotificationPreferences);
      expect(bPreferences.length).toBe(1);
      expect(bPreferences[0].userId).toBe(userB.id);
    });
    testLogger.info("RLS test passed.");
  });
});
