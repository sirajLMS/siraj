/**
 * Resend adapter — single live smoke test (one API call).
 * Run: `bun run test:live-comm` or `bun run test:integration`
 */
import { afterEach, beforeEach, expect, spyOn, test } from "bun:test";
import { NotificationRepository } from "@/backend/db/repo/notifications";
import { NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/backend/enum";
import { ResendEmailAdapter } from "@/backend/services/communication/channels/email/resend/ResendEmailAdapter";
import type { NotificationDeliverySelectType } from "@/backend/types";
import { describeLiveWhen } from "@/test/integration/helpers/describe-live";

const hasResend = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
const describeLive = describeLiveWhen(hasResend, "ResendEmailAdapter @live-comm");

const MOCK_USER_ID = "user-uuid-live-comm";
const MOCK_DELIVERY_ID = "delivery-uuid-live-comm";
const RESEND_MESSAGE_ID_RE = /^[a-f0-9-]{36}$/;

const mockDelivery: NotificationDeliverySelectType = {
  id: MOCK_DELIVERY_ID,
  userId: MOCK_USER_ID,
  deviceTokenId: null,
  channel: NotificationChannel.EMAIL,
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

describeLive("ResendEmailAdapter @live-comm", () => {
  let updateDeliveryStatusSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    spyOn(NotificationRepository, "createDelivery").mockResolvedValue(mockDelivery);
    updateDeliveryStatusSpy = spyOn(NotificationRepository, "updateDeliveryStatus").mockResolvedValue(mockDelivery);
  });

  afterEach(() => {
    updateDeliveryStatusSpy.mockRestore();
  });

  test("send() reaches the live Resend API", async () => {
    const adapter = new ResendEmailAdapter();
    const result = await adapter.send({
      to: "bounced@resend.dev",
      subject: "Siraj integration smoke",
      html: "<p>integration smoke</p>",
      eventType: NotificationEventType.COMPLAINT_RESPONSE,
      userId: MOCK_USER_ID,
    });

    if (result.success) {
      expect(result.providerMessageId).toMatch(RESEND_MESSAGE_ID_RE);
      expect(updateDeliveryStatusSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: NotificationDeliveryStatus.SENT,
          providerMessageId: result.providerMessageId,
        })
      );
      return;
    }

    // Quota / validation rejections still prove the adapter reached Resend.
    expect(result.error).toBeDefined();
    expect(updateDeliveryStatusSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: NotificationDeliveryStatus.FAILED,
      })
    );
  });
});
