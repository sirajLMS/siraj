/**
 * Twilio SMS adapter — single live smoke test (one API call, no billable delivery).
 * Run: `bun run test:live-comm` or `bun run test:integration`
 */
import { afterEach, beforeEach, expect, spyOn, test } from "bun:test";
import { NotificationRepository } from "@/backend/db/repo/notifications";
import { NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/backend/enum";
import { TwilioSmsAdapter } from "@/backend/services/communication/channels/sms/twilio/TwilioSmsAdapter";
import type { NotificationDeliverySelectType } from "@/backend/types";
import { describeLiveWhen } from "@/test/integration/helpers/describe-live";

const hasTwilio = Boolean(
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER
);
const describeLive = describeLiveWhen(hasTwilio, "TwilioSmsAdapter @live-comm");

const MOCK_USER_ID = "user-uuid-live-sms-0001";
const MOCK_DELIVERY_ID = "delivery-uuid-live-sms-0001";
const TWILIO_DUMMY_INVALID_TO = "+15555550100";

const mockDelivery: NotificationDeliverySelectType = {
  id: MOCK_DELIVERY_ID,
  userId: MOCK_USER_ID,
  deviceTokenId: null,
  channel: NotificationChannel.SMS,
  eventType: NotificationEventType.COMPLAINT_RESPONSE,
  status: NotificationDeliveryStatus.PENDING,
  title: null,
  body: null,
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

describeLive("TwilioSmsAdapter @live-comm", () => {
  let updateDeliveryStatusSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    spyOn(NotificationRepository, "getSmsCountInLastHour").mockResolvedValue(0);
    spyOn(NotificationRepository, "createDelivery").mockResolvedValue(mockDelivery);
    updateDeliveryStatusSpy = spyOn(NotificationRepository, "updateDeliveryStatus").mockResolvedValue(mockDelivery);
  });

  afterEach(() => {
    updateDeliveryStatusSpy.mockRestore();
  });

  test("send() reaches Twilio API and records FAILED for an invalid recipient", async () => {
    const adapter = new TwilioSmsAdapter();
    const result = await adapter.send({
      to: TWILIO_DUMMY_INVALID_TO,
      body: "Siraj integration smoke",
      eventType: NotificationEventType.COMPLAINT_RESPONSE,
      userId: MOCK_USER_ID,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(updateDeliveryStatusSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: NotificationDeliveryStatus.FAILED,
      })
    );
  });
});
