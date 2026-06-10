// cspell:ignore: notif
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import {
  DevicePlatform,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationEventType,
} from "../../../lib/enum";
import { testLogger } from "../../../lib/testlogger";
import type { UserEntity } from "../../types";
import { db } from "../drizzleDb";
import { NotificationRepository } from "../repo/notification.repository";
import { notificationDeliveries, userDeviceTokens, users } from "../schema";

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

describe("Notification Delivery Tracking", () => {
  beforeAll(async () => {
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'test_rls_user_notif_delivery') THEN
          CREATE ROLE test_rls_user_notif_delivery WITH LOGIN PASSWORD 'test_rls_pass';
        END IF;
      END
      $$;
      GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test_rls_user_notif_delivery;
      GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test_rls_user_notif_delivery;
    `);
  });

  afterAll(async () => {
    try {
      await db.execute(sql`
        REASSIGN OWNED BY test_rls_user_notif_delivery TO postgres;
        DROP OWNED BY test_rls_user_notif_delivery;
        DROP ROLE IF EXISTS test_rls_user_notif_delivery;
      `);
    } catch {
      testLogger.warn("Failed to drop RLS test role for notification delivery tracking");
    }
  });

  test("Registers device tokens and tracks delivery lifecycle", async () => {
    testLogger.info("Testing device token registration and delivery lifecycle...");
    await runInRollback(async tx => {
      const now = new Date();
      const [user] = (await tx
        .insert(users)
        .values({
          name: "Delivery Test User",
          email: `delivery-${randomUUID()}@example.com`,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [UserEntity];

      const pushToken = `fcm-token-${randomUUID()}`;
      const deviceToken = await NotificationRepository.registerDeviceToken(
        {
          userId: user.id,
          token: pushToken,
          platform: DevicePlatform.ANDROID,
          deviceName: "Pixel Test Device",
        },
        tx
      );

      expect(deviceToken.isActive).toBe(true);
      expect(deviceToken.platform).toBe(DevicePlatform.ANDROID);

      const delivery = await NotificationRepository.createDelivery(
        {
          userId: user.id,
          deviceTokenId: deviceToken.id,
          channel: NotificationChannel.PUSH,
          eventType: NotificationEventType.CLASS_REMINDER,
          title: "Class Reminder",
          body: "Your class starts in 30 minutes",
        },
        tx
      );

      expect(delivery.status).toBe(NotificationDeliveryStatus.PENDING);

      const sentDelivery = await NotificationRepository.updateDeliveryStatus(
        {
          deliveryId: delivery.id,
          status: NotificationDeliveryStatus.SENT,
          providerMessageId: `provider-${randomUUID()}`,
        },
        tx
      );

      expect(sentDelivery.status).toBe(NotificationDeliveryStatus.SENT);
      expect(sentDelivery.sentAt).not.toBeNull();

      const openedDelivery = await NotificationRepository.recordDeliveryOpened(
        delivery.id,
        { source: "mobile_app" },
        tx
      );

      expect(openedDelivery.status).toBe(NotificationDeliveryStatus.OPENED);
      expect(openedDelivery.openedAt).not.toBeNull();
    });
    testLogger.info("Delivery lifecycle test passed.");
  });

  test("Webhook handler resolves delivery by provider message id", async () => {
    testLogger.info("Testing delivery webhook handler...");
    await runInRollback(async tx => {
      const now = new Date();
      const [user] = (await tx
        .insert(users)
        .values({
          name: "Webhook Test User",
          email: `webhook-${randomUUID()}@example.com`,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [UserEntity];

      const providerMessageId = `provider-${randomUUID()}`;
      const delivery = await NotificationRepository.createDelivery(
        {
          userId: user.id,
          channel: NotificationChannel.PUSH,
          eventType: NotificationEventType.INVOICE_GENERATED,
        },
        tx
      );

      await NotificationRepository.updateDeliveryStatus(
        {
          deliveryId: delivery.id,
          status: NotificationDeliveryStatus.SENT,
          providerMessageId,
        },
        tx
      );

      const webhookDelivery = await NotificationRepository.handleDeliveryWebhook(
        providerMessageId,
        NotificationDeliveryStatus.DELIVERED,
        { event: "delivery_confirmed" },
        null,
        tx
      );

      expect(webhookDelivery.status).toBe(NotificationDeliveryStatus.DELIVERED);
      expect(webhookDelivery.deliveredAt).not.toBeNull();
      expect(webhookDelivery.webhookPayload).toEqual({ event: "delivery_confirmed" });
    });
    testLogger.info("Webhook handler test passed.");
  });

  test("Analytics report counts statuses and rates", async () => {
    testLogger.info("Testing notification delivery analytics...");
    await runInRollback(async tx => {
      const now = new Date();
      const [user] = (await tx
        .insert(users)
        .values({
          name: "Analytics Test User",
          email: `analytics-${randomUUID()}@example.com`,
          password: "password",
          createdAt: now,
          updatedAt: now,
        })
        .returning()) as [UserEntity];

      const openedDelivery = await NotificationRepository.createDelivery(
        {
          userId: user.id,
          channel: NotificationChannel.EMAIL,
          eventType: NotificationEventType.COMPLAINT_RESPONSE,
        },
        tx
      );
      await NotificationRepository.updateDeliveryStatus(
        {
          deliveryId: openedDelivery.id,
          status: NotificationDeliveryStatus.OPENED,
        },
        tx
      );

      const failedDelivery = await NotificationRepository.createDelivery(
        {
          userId: user.id,
          channel: NotificationChannel.SMS,
          eventType: NotificationEventType.CLASS_REMINDER,
        },
        tx
      );
      await NotificationRepository.updateDeliveryStatus(
        {
          deliveryId: failedDelivery.id,
          status: NotificationDeliveryStatus.FAILED,
          failureReason: "Invalid phone number",
        },
        tx
      );

      const analytics = await NotificationRepository.getDeliveryAnalytics({ userId: user.id }, tx);

      expect(analytics.totalDeliveries).toBe(2);
      expect(analytics.openRate).toBe(0.5);
      expect(analytics.failureRate).toBe(0.5);
      expect(analytics.statusCounts.some(row => row.status === NotificationDeliveryStatus.OPENED)).toBe(true);
      expect(analytics.statusCounts.some(row => row.status === NotificationDeliveryStatus.FAILED)).toBe(true);
    });
    testLogger.info("Analytics test passed.");
  });

  test("RLS prevents users from seeing others' deliveries and tokens", async () => {
    testLogger.info("Testing RLS on notification delivery tracking...");
    await runInRollback(async tx => {
      const now = new Date();
      const [userA] = (await tx
        .insert(users)
        .values({ name: "UserA", email: `a-${randomUUID()}@x.com`, password: "p", createdAt: now, updatedAt: now })
        .returning()) as [UserEntity];
      const [userB] = (await tx
        .insert(users)
        .values({ name: "UserB", email: `b-${randomUUID()}@x.com`, password: "p", createdAt: now, updatedAt: now })
        .returning()) as [UserEntity];

      await NotificationRepository.registerDeviceToken(
        {
          userId: userB.id,
          token: `token-${randomUUID()}`,
          platform: DevicePlatform.IOS,
        },
        tx
      );
      await NotificationRepository.createDelivery(
        {
          userId: userB.id,
          channel: NotificationChannel.PUSH,
          eventType: NotificationEventType.CLASS_REMINDER,
        },
        tx
      );

      await tx.execute(sql`SET LOCAL ROLE test_rls_user_notif_delivery`);
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userA.id}, true)`);

      const visibleTokens = await tx.select().from(userDeviceTokens);
      const visibleDeliveries = await tx.select().from(notificationDeliveries);

      expect(visibleTokens.length).toBe(0);
      expect(visibleDeliveries.length).toBe(0);

      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userB.id}, true)`);
      const userBTokens = await tx.select().from(userDeviceTokens).where(eq(userDeviceTokens.userId, userB.id));
      const userBDeliveries = await tx
        .select()
        .from(notificationDeliveries)
        .where(and(eq(notificationDeliveries.userId, userB.id)));

      expect(userBTokens.length).toBe(1);
      expect(userBDeliveries.length).toBe(1);
    });
    testLogger.info("RLS test passed.");
  });
});
