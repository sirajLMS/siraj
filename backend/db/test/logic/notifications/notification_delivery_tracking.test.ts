import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { NotificationRepository } from "@/backend/db/repo";
import { notificationDeliveries, userDeviceTokens } from "@/backend/db/schema";
import { createTestUser } from "@/backend/db/test/entity-setup";
import {
  closeRlsClients,
  runInRollback,
  setupRlsPolicies,
  setupRlsRole,
  teardownRlsRole,
} from "@/backend/db/test/test-utils";
import { DevicePlatform, NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/backend/enum";
import { testLogger } from "@/shared/lib/logger/testlogger";

describe("Notification Delivery Tracking", () => {
  beforeAll(async () => {
    await setupRlsRole();
    await setupRlsPolicies([
      { table: "users", name: "users_select_policy", definition: "FOR SELECT USING (deleted_at IS NULL)" },
      { table: "users", name: "users_insert_policy", definition: "FOR INSERT WITH CHECK (deleted_at IS NULL)" },
      {
        table: "user_device_tokens",
        name: "user_device_tokens_access_policy",
        definition: "FOR ALL USING (user_id = current_user_id()) WITH CHECK (user_id = current_user_id())",
      },
      {
        table: "notification_deliveries",
        name: "notification_deliveries_access_policy",
        definition: "FOR ALL USING (user_id = current_user_id()) WITH CHECK (user_id = current_user_id())",
      },
    ]);
  });

  afterAll(async () => {
    await closeRlsClients();
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
        user.id,
        {
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
      const user = await createTestUser(tx, {
        name: "Webhook Test User",
        email: `webhook-${randomUUID()}@example.com`,
      });

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

      expect(webhookDelivery).not.toBeNull();
      expect(webhookDelivery?.status).toBe(NotificationDeliveryStatus.DELIVERED);
      expect(webhookDelivery?.deliveredAt).not.toBeNull();
      expect(webhookDelivery?.webhookPayload).toEqual({ event: "delivery_confirmed" });
    });
    testLogger.info("Webhook handler test passed.");
  });

  test("Analytics report counts statuses and rates", async () => {
    testLogger.info("Testing notification delivery analytics...");
    await runInRollback(async tx => {
      const user = await createTestUser(tx, {
        name: "Analytics Test User",
        email: `analytics-${randomUUID()}@example.com`,
      });

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
        userB.id,
        {
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

      expect(visibleTokens).toHaveLength(0);
      expect(visibleDeliveries).toHaveLength(0);

      await tx.execute(sql`RESET ROLE`);
      await tx.execute(sql`SET LOCAL ROLE "test_rls_user"`);
      await tx.execute(sql`SELECT set_config('app.current_user_id', ${userB.id}, true)`);

      const userBTokens = await tx.select({ userId: userDeviceTokens.userId }).from(userDeviceTokens);
      const userBDeliveries = await tx.select({ userId: notificationDeliveries.userId }).from(notificationDeliveries);

      expect(userBTokens).toHaveLength(1);
      expect(userBDeliveries).toHaveLength(1);
    });
    testLogger.info("RLS test passed.");
  });
});
