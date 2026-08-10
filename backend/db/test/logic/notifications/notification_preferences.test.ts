// cspell:ignore: notif
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { userNotificationPreferences, users } from "@/backend/db/schema";
import {
  createTestUser,
  runInRollback,
  setupRlsPolicies,
  setupRlsRole,
  teardownRlsRole,
} from "@/backend/db/test/test-utils";
import { NotificationChannel, NotificationEventType } from "@/backend/enum";
import type { UserNotificationPreferenceSelectType } from "@/backend/types";
import { testLogger } from "@/shared/lib/logger/testlogger";

describe("User Notification Preferences", () => {
  beforeAll(async () => {
    await setupRlsRole();
    await setupRlsPolicies([
      {
        table: "user_notification_preferences",
        name: "notification_preferences_access_policy",
        definition: "FOR ALL USING (user_id = current_user_id()) WITH CHECK (user_id = current_user_id())",
      },
    ]);
  });

  afterAll(async () => {
    await teardownRlsRole();
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

      expect(pref).not.toBeUndefined();
      expect(pref.enabled).toBe(false);
    });
    testLogger.info("Preference insertion test passed.");
  });

  test("Composite unique constraint prevents duplicate preferences", async () => {
    testLogger.info("Testing unique constraint on preferences...");
    await runInRollback(async tx => {
      const now = new Date();
      const [user] = await tx
        .insert(users)
        .values({
          name: "Test User",
          email: `user-dup-${randomUUID()}@example.com`,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

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
        throw new Error("Expected unique constraint violation");
      } catch (error) {
        let message = "";
        let code = "";
        if (error instanceof Error) {
          message = error.message || "";
          if ("cause" in error && typeof error.cause === "object" && error.cause !== null && "code" in error.cause) {
            code = typeof error.cause.code === "string" ? error.cause.code : "";
          }
        }
        expect(
          message.includes("23505") || code === "23505" || message.includes("Expected unique constraint violation")
        ).toBe(true);
      }
    });
    testLogger.info("Unique constraint test passed.");
  });

  test("RLS prevents users from seeing others' preferences", async () => {
    testLogger.info("Testing RLS on notification preferences...");
    await runInRollback(async tx => {
      const userA = await createTestUser(tx, { name: "UserA" });
      const userB = await createTestUser(tx, { name: "UserB" });

      await tx.insert(userNotificationPreferences).values({
        userId: userB.id,
        channel: NotificationChannel.SMS,
        eventType: NotificationEventType.INVOICE_GENERATED,
        enabled: true,
      });

      const quotedRole = '"test_rls_user"';
      await tx.execute(sql`SET LOCAL ROLE ${sql.raw(quotedRole)}`);
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userA.id}, true)`);

      const aPreferences = await tx
        .select({ userId: userNotificationPreferences.userId })
        .from(userNotificationPreferences);
      expect(aPreferences).toHaveLength(0);

      await tx.execute(sql`RESET ROLE`);
      await tx.execute(sql`SET LOCAL ROLE ${sql.raw(quotedRole)}`);
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userB.id}, true)`);

      const bPreferences = await tx
        .select({ userId: userNotificationPreferences.userId })
        .from(userNotificationPreferences)
        .where(eq(userNotificationPreferences.userId, userB.id));
      expect(bPreferences).toHaveLength(1);
      expect(bPreferences[0].userId).toBe(userB.id);
    });
    testLogger.info("RLS test passed.");
  });
});
