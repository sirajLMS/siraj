// cspell:ignore: notif
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { NotificationChannel, NotificationEventType } from "@/shared/lib/enum";
import { testLogger } from "@/shared/lib/testlogger";
import type { UserEntity, UserNotificationPreferenceSelectType } from "../../../types";
import { userNotificationPreferences, users } from "../../schema";
import { createTestUser, runInRollback, setupRlsRole, teardownRlsRole } from "../test-utils";

describe("User Notification Preferences", () => {
  const RLS_ROLE = "test_rls_user_notif";

  beforeAll(async () => {
    await setupRlsRole(RLS_ROLE);
  });

  afterAll(async () => {
    await teardownRlsRole(RLS_ROLE);
  });

  test("Can insert and retrieve preferences", async () => {
    testLogger.info("Testing preference insertion...");
    await runInRollback(async tx => {
      const user = await createTestUser(tx, {
        name: "Test User",
        email: `user-${randomUUID()}@example.com`,
      });

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
      const userA = await createTestUser(tx, { name: "UserA" });
      const userB = await createTestUser(tx, { name: "UserB" });

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
