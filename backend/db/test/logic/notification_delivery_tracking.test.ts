// cspell:ignore: notif
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import {
  DevicePlatform,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationEventType,
} from "@/shared/lib/enum";
import { testLogger } from "@/shared/lib/testlogger";
import type { UserEntity } from "../../../types";
import { NotificationRepository } from "../../repo/notification.repository";
import { notificationDeliveries, userDeviceTokens, users } from "../../schema";
import { createTestUser, runInRollback, setupRlsRole, teardownRlsRole } from "../test-utils";

describe("Notification Delivery Tracking", () => {
  beforeAll(async () => {
    await setupRlsRole();
  });

  afterAll(async () => {
    await teardownRlsRole();
  });

  test("Registers device tokens and tracks delivery lifecycle", async () => {
    testLogger.info("Testing device token registration and delivery lifecycle...");
    await runInRollback(async tx => {
      const user = await createTestUser(tx, {
        name: "Delivery Test User",
        email: `delivery-${randomUUID()}@example.com`,
      });

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
        {
          providerMessageId,
          status: NotificationDeliveryStatus.DELIVERED,
          webhookPayload: { event: "delivery_confirmed" },
          failureReason: null,
        },
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
      const userA = await createTestUser(tx, { name: "UserA" });
      const userB = await createTestUser(tx, { name: "UserB" });

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

      await tx.execute(sql`SET LOCAL ROLE "test_rls_user"`);
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userA.id}, true)`);

      const visibleTokens = await tx.select({ userId: userDeviceTokens.userId }).from(userDeviceTokens);
      const visibleDeliveries = await tx.select({ userId: notificationDeliveries.userId }).from(notificationDeliveries);

      expect(visibleTokens.length).toBe(0);
      expect(visibleDeliveries.length).toBe(0);

      await tx.execute(sql`RESET ROLE`);
      await tx.execute(sql`SET LOCAL ROLE "test_rls_user"`);
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userB.id}, true)`);

      const userBTokens = await tx.select({ userId: userDeviceTokens.userId }).from(userDeviceTokens);
      const userBDeliveries = await tx.select({ userId: notificationDeliveries.userId }).from(notificationDeliveries);

      expect(userBTokens.length).toBe(1);
      expect(userBDeliveries.length).toBe(1);
    });
    testLogger.info("RLS test passed.");
  });
});
