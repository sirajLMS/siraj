/**
 * Integration test for the FCM push adapter.
 *
 * Tag: `@live-comm` — these tests make REAL network calls to Firebase Cloud
 * Messaging. They must NOT run in default CI.
 *
 * Gating uses `describe.skip` when FIREBASE_PROJECT_ID / FIREBASE_PRIVATE_KEY /
 * FIREBASE_CLIENT_EMAIL are absent (FX precedent). For a real live run locally,
 * use `bun run test:live-comm` (requires keys in `.env`).
 */
import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { deleteApp, getApp, getApps } from "firebase-admin/app";
import { NotificationRepository } from "@/backend/db/repo";
import { DevicePlatform, NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/backend/enum";
import { FcmPushAdapter } from "@/backend/services/communication/channels/push/fcm/FcmPushAdapter";
import {
  FCM_INVALID_TOKEN_ERROR,
  FCM_TOKEN_EXPIRED_ERROR,
} from "@/backend/services/communication/channels/push/fcm/fcm.types";
import type { PushPayload } from "@/backend/services/communication/channels/push/IPushChannel";
import { deliveryFailedMessage } from "@/backend/services/communication/utils";
import type {
  CreateNotificationDeliveryInput,
  NotificationDeliverySelectType,
  UpdateDeliveryStatusInput,
  UserDeviceTokenSelectType,
} from "@/backend/types";
import { testLogger } from "@/shared/lib/logger/testlogger";

const hasFirebase = Boolean(
  process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL
);
const describeLive = hasFirebase ? describe : describe.skip;
// COMMUNICATION-SPEC: bun:test `test.skip` requires (name, fn); gate token-dependent
// cases with describeLive-style ternary instead of in-body `test.skip("…")`.
const hasFcmTestToken = Boolean(process.env.FCM_TEST_DEVICE_TOKEN);
const testWithDeviceToken = hasFcmTestToken ? test : test.skip;

const MOCK_USER_ID = "live-comm-push-user";

const MOCK_SEND_PAYLOAD: PushPayload = {
  userId: MOCK_USER_ID,
  title: "Siraj live-comm push test",
  body: "Integration test body — safe to ignore",
  eventType: NotificationEventType.CLASS_REMINDER,
};

function buildMockDelivery(id: string, deviceTokenId: string | null = null): NotificationDeliverySelectType {
  return {
    id,
    userId: MOCK_USER_ID,
    deviceTokenId,
    channel: NotificationChannel.PUSH,
    eventType: NotificationEventType.CLASS_REMINDER,
    status: NotificationDeliveryStatus.PENDING,
    title: MOCK_SEND_PAYLOAD.title,
    body: MOCK_SEND_PAYLOAD.body,
    providerMessageId: null,
    failureReason: null,
    webhookPayload: null,
    sentAt: null,
    deliveredAt: null,
    openedAt: null,
    failedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function buildMockDeviceToken(id: string, token: string): UserDeviceTokenSelectType {
  return {
    id,
    userId: MOCK_USER_ID,
    token,
    platform: DevicePlatform.ANDROID,
    deviceName: null,
    isActive: true,
    lastUsedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describeLive("FcmPushAdapter @live-comm", () => {
  let getActiveDeviceTokensSpy: ReturnType<typeof spyOn>;
  let createDeliveriesBatchSpy: ReturnType<typeof spyOn>;
  let updateDeliveryStatusSpy: ReturnType<typeof spyOn>;
  let deactivateDeviceTokenSpy: ReturnType<typeof spyOn>;
  let adapter: FcmPushAdapter | undefined;

  beforeEach(() => {
    getActiveDeviceTokensSpy = spyOn(NotificationRepository, "getActiveDeviceTokensForUser").mockResolvedValue([]);
    createDeliveriesBatchSpy = spyOn(NotificationRepository, "createDeliveriesBatch").mockImplementation(
      async (inputs: CreateNotificationDeliveryInput[]) =>
        inputs.map((input, index) => buildMockDelivery(`delivery-${index + 1}`, input.deviceTokenId ?? null))
    );
    updateDeliveryStatusSpy = spyOn(NotificationRepository, "updateDeliveryStatus").mockResolvedValue(
      buildMockDelivery("delivery-1")
    );
    deactivateDeviceTokenSpy = spyOn(NotificationRepository, "deactivateDeviceToken").mockResolvedValue(null);
  });

  afterEach(async () => {
    getActiveDeviceTokensSpy.mockRestore();
    createDeliveriesBatchSpy.mockRestore();
    updateDeliveryStatusSpy.mockRestore();
    deactivateDeviceTokenSpy.mockRestore();

    if (adapter) {
      await adapter.disconnect();
      adapter = undefined;
    }

    // CRITICAL: firebase-admin singleton leak prevention
    if (getApps().length > 0) {
      await deleteApp(getApp());
    }
  });

  test("P1: validateConfig() returns true when FIREBASE_* env vars are set", async () => {
    adapter = new FcmPushAdapter();
    const result = await adapter.validateConfig();
    expect(result).toBe(true);
  });

  test("P2: send with no device tokens short-circuits without delivery writes", async () => {
    getActiveDeviceTokensSpy.mockResolvedValue([]);
    adapter = new FcmPushAdapter();

    const result = await adapter.send(MOCK_SEND_PAYLOAD);

    expect(result).toEqual({ success: true, successCount: 0, failureCount: 0 });
    expect(createDeliveriesBatchSpy).not.toHaveBeenCalled();
    expect(updateDeliveryStatusSpy).not.toHaveBeenCalled();
  });

  test("P3: invalid token marks delivery FAILED (deactivate only on known token-lifecycle errors)", async () => {
    const invalidToken = "invalid-token-123";
    const deviceToken = buildMockDeviceToken("token-invalid-1", invalidToken);
    getActiveDeviceTokensSpy.mockResolvedValue([deviceToken]);
    adapter = new FcmPushAdapter();

    const result = await adapter.send(MOCK_SEND_PAYLOAD);

    expect(result.success).toBe(false);
    expect(result.successCount).toBe(0);
    expect(result.failureCount).toBe(1);
    expect(updateDeliveryStatusSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: NotificationDeliveryStatus.FAILED,
      })
    );

    const failedCall = (updateDeliveryStatusSpy.mock.calls as [UpdateDeliveryStatusInput][]).find(
      call => call[0].status === NotificationDeliveryStatus.FAILED
    );
    const failureReason = String(failedCall?.[0].failureReason ?? "");
    testLogger.debug("P3 FCM failure reason", { failureReason });

    // COMMUNICATION-SPEC: adapter only deactivates on FCM_INVALID_TOKEN_ERROR /
    // FCM_TOKEN_EXPIRED_ERROR. Live FCM often returns messaging/invalid-argument
    // for garbage tokens — assert deactivate only when the known codes appear.
    const shouldDeactivate =
      failureReason.includes(FCM_INVALID_TOKEN_ERROR) || failureReason.includes(FCM_TOKEN_EXPIRED_ERROR);
    if (shouldDeactivate) {
      expect(deactivateDeviceTokenSpy).toHaveBeenCalledTimes(1);
      expect(deactivateDeviceTokenSpy).toHaveBeenCalledWith(MOCK_USER_ID, invalidToken);
    } else {
      expect(deactivateDeviceTokenSpy).not.toHaveBeenCalled();
    }
  });

  test("P4: unregistered-looking token marks delivery FAILED (deactivate only on known token-lifecycle errors)", async () => {
    // COMMUNICATION-SPEC: intentionally non-secret placeholder for FCM unregistered-id path (not a real credential)
    const unregisteredRegistrationId = "not-a-real-fcm-registration-id-for-p4-expired-path";
    const deviceToken = buildMockDeviceToken("token-stale-1", unregisteredRegistrationId);
    getActiveDeviceTokensSpy.mockResolvedValue([deviceToken]);
    adapter = new FcmPushAdapter();

    const result = await adapter.send(MOCK_SEND_PAYLOAD);

    expect(result.success).toBe(false);
    expect(result.successCount).toBe(0);
    expect(result.failureCount).toBe(1);

    const failedCall = (updateDeliveryStatusSpy.mock.calls as [UpdateDeliveryStatusInput][]).find(
      call => call[0].status === NotificationDeliveryStatus.FAILED
    );
    expect(failedCall).toBeDefined();
    const failureReason = String(failedCall?.[0].failureReason ?? "");
    testLogger.debug("P4 FCM failure reason", { failureReason });

    const shouldDeactivate =
      failureReason.includes(FCM_INVALID_TOKEN_ERROR) || failureReason.includes(FCM_TOKEN_EXPIRED_ERROR);
    if (shouldDeactivate) {
      expect(deactivateDeviceTokenSpy).toHaveBeenCalledTimes(1);
      expect(deactivateDeviceTokenSpy).toHaveBeenCalledWith(MOCK_USER_ID, unregisteredRegistrationId);
    } else {
      expect(deactivateDeviceTokenSpy).not.toHaveBeenCalled();
    }
  });

  // set FCM_TEST_DEVICE_TOKEN to run — skipped via testWithDeviceToken when absent
  testWithDeviceToken("P5: valid FCM_TEST_DEVICE_TOKEN sends a real push", async () => {
    const testToken = process.env.FCM_TEST_DEVICE_TOKEN as string;
    const deviceToken = buildMockDeviceToken("token-valid-1", testToken);
    getActiveDeviceTokensSpy.mockResolvedValue([deviceToken]);
    adapter = new FcmPushAdapter();

    const result = await adapter.send(MOCK_SEND_PAYLOAD);

    expect(result.success).toBe(true);
    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(0);
    expect(updateDeliveryStatusSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: NotificationDeliveryStatus.SENT,
        providerMessageId: expect.any(String),
      })
    );
    const sentCall = (updateDeliveryStatusSpy.mock.calls as [UpdateDeliveryStatusInput][]).find(
      call => call[0].status === NotificationDeliveryStatus.SENT
    );
    const messageId = sentCall?.[0].providerMessageId;
    expect(messageId).toBeTruthy();
    testLogger.debug("P5 FCM messageId", { messageId });
  });

  // set FCM_TEST_DEVICE_TOKEN to run — skipped via testWithDeviceToken when absent
  testWithDeviceToken("P6: partial multicast — one valid + one invalid token", async () => {
    const testToken = process.env.FCM_TEST_DEVICE_TOKEN as string;
    const validDeviceToken = buildMockDeviceToken("token-valid-1", testToken);
    const invalidDeviceToken = buildMockDeviceToken("token-invalid-1", "invalid-token-123");
    getActiveDeviceTokensSpy.mockResolvedValue([validDeviceToken, invalidDeviceToken]);
    adapter = new FcmPushAdapter();

    const result = await adapter.send(MOCK_SEND_PAYLOAD);

    expect(result.success).toBe(false);
    expect(result.successCount).toBe(1);
    expect(result.failureCount).toBe(1);
    expect(result.errors).toEqual([deliveryFailedMessage("push")]);
    expect(deactivateDeviceTokenSpy).toHaveBeenCalledTimes(1);
    expect(deactivateDeviceTokenSpy).toHaveBeenCalledWith(MOCK_USER_ID, "invalid-token-123");
  });

  // set FCM_TEST_DEVICE_TOKEN to run — skipped via testWithDeviceToken when absent
  testWithDeviceToken("P7: live send updates delivery status SENT with FCM messageId", async () => {
    const testToken = process.env.FCM_TEST_DEVICE_TOKEN as string;
    const deviceToken = buildMockDeviceToken("token-valid-p7", testToken);
    getActiveDeviceTokensSpy.mockResolvedValue([deviceToken]);
    adapter = new FcmPushAdapter();

    const result = await adapter.send(MOCK_SEND_PAYLOAD);

    expect(result.success).toBe(true);
    expect(result.successCount).toBe(1);

    const sentCall = (updateDeliveryStatusSpy.mock.calls as [UpdateDeliveryStatusInput][]).find(
      call => call[0].status === NotificationDeliveryStatus.SENT
    );
    expect(sentCall).toBeDefined();
    const providerMessageId = sentCall?.[0].providerMessageId;
    expect(typeof providerMessageId).toBe("string");
    expect(providerMessageId).toBeTruthy();
    testLogger.debug("P7 FCM providerMessageId for webhook reconciliation", { providerMessageId });
  });
});
