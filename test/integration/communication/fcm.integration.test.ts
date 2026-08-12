/**
 * FCM push adapter — single live smoke test (one API call, invalid token).
 * Run: `bun run test:live-comm` or `bun run test:integration`
 */
import { afterEach, beforeEach, expect, spyOn, test } from "bun:test";
import { deleteApp, getApp, getApps } from "firebase-admin/app";
import { NotificationRepository } from "@/backend/db/repo/notifications";
import { DevicePlatform, NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/backend/enum";
import { FcmPushAdapter } from "@/backend/services/communication/channels/push/fcm/FcmPushAdapter";
import type { PushPayload } from "@/backend/services/communication/channels/push/IPushChannel";
import type {
  CreateNotificationDeliveryInput,
  NotificationDeliverySelectType,
  UserDeviceTokenSelectType,
} from "@/backend/types";
import { describeLiveWhen } from "@/test/integration/helpers/describe-live";

const hasFirebase = Boolean(
  process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL
);
const describeLive = describeLiveWhen(hasFirebase, "FcmPushAdapter @live-comm");

const MOCK_USER_ID = "live-comm-push-user";

const MOCK_SEND_PAYLOAD: PushPayload = {
  userId: MOCK_USER_ID,
  title: "Siraj integration smoke",
  body: "Integration smoke — safe to ignore",
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
    metadata: null,
    sentAt: null,
    deliveredAt: null,
    openedAt: null,
    failedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describeLive("FcmPushAdapter @live-comm", () => {
  let updateDeliveryStatusSpy: ReturnType<typeof spyOn>;
  let adapter: FcmPushAdapter | undefined;

  beforeEach(() => {
    spyOn(NotificationRepository, "getActiveDeviceTokensForUser").mockResolvedValue([
      {
        id: "token-invalid-1",
        userId: MOCK_USER_ID,
        token: "invalid-token-integration-smoke",
        platform: DevicePlatform.ANDROID,
        deviceName: null,
        isActive: true,
        lastUsedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } satisfies UserDeviceTokenSelectType,
    ]);
    spyOn(NotificationRepository, "createDeliveriesBatch").mockImplementation(
      async (inputs: CreateNotificationDeliveryInput[]) =>
        inputs.map((input, index) => buildMockDelivery(`delivery-${index + 1}`, input.deviceTokenId ?? null))
    );
    updateDeliveryStatusSpy = spyOn(NotificationRepository, "updateDeliveryStatus").mockResolvedValue(
      buildMockDelivery("delivery-1")
    );
    spyOn(NotificationRepository, "deactivateDeviceToken").mockResolvedValue(null);
  });

  afterEach(async () => {
    updateDeliveryStatusSpy.mockRestore();

    if (adapter) {
      await adapter.disconnect();
      adapter = undefined;
    }

    if (getApps().length > 0) {
      await deleteApp(getApp());
    }
  });

  test("send() reaches FCM API and records FAILED for an invalid device token", async () => {
    adapter = new FcmPushAdapter();
    const result = await adapter.send(MOCK_SEND_PAYLOAD);

    expect(result.success).toBe(false);
    expect(result.failureCount).toBe(1);
    expect(updateDeliveryStatusSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: NotificationDeliveryStatus.FAILED,
      })
    );
  });
});
