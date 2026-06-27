// cspell:ignore: notif
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NotificationChannel, NotificationEventType } from "@/shared/lib/enum";
import { testLogger } from "@/shared/lib/testlogger";
import type { UserEntity, UserNotificationPreferenceSelectType } from "../../../types";
import { userNotificationPreferences, users } from "../../schema";
import {
  closeRlsClients,
  createTestUser,
  queryAsRlsRole,
  runInRollback,
  setupRlsRole,
  teardownRlsRole,
} from "../test-utils";

describe("User Notification Preferences", () => {
  const RLS_ROLE = "test_rls_user_notif";

  beforeAll(async () => {
    await setupRlsRole(RLS_ROLE);
  });

  afterAll(async () => {
    await teardownRlsRole(RLS_ROLE);
    await closeRlsClients();
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
        expect(true).toBe(false);
      } catch (error) {
        const err = error as Error & { cause?: { code?: string } };
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

      await tx.insert(userNotificationPreferences).values({
        userId: userB.id,
        channel: NotificationChannel.SMS,
        eventType: NotificationEventType.INVOICE_GENERATED,
        enabled: true,
      });

      const preferences = await queryAsRlsRole<{ user_id: string }>(
        RLS_ROLE,
        userA.id,
        `SELECT user_id FROM "user_notification_preferences"`
      );
      expect(preferences.length).toBe(0);

      const bPreferences = await queryAsRlsRole<{ user_id: string }>(
        RLS_ROLE,
        userB.id,
        `SELECT user_id FROM "user_notification_preferences" WHERE "user_id" = $1`,
        [userB.id]
      );
      expect(bPreferences.length).toBe(1);
      expect(bPreferences[0].user_id).toBe(userB.id);
    });
    testLogger.info("RLS test passed.");
  });
});
