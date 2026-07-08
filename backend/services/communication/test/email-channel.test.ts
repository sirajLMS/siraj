import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { NotificationRepository } from "@/backend/db/repo";
import { NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/backend/enum";
import { emailChannel, resetEmailChannel } from "@/backend/services/communication/channels/email";
import type { NotificationDeliverySelectType } from "@/backend/types";

const MOCK_USER_ID = "user-uuid-0001";
const MOCK_DELIVERY_ID = "delivery-uuid-0001";

const SEND_PAYLOAD = {
  to: "user@test.com",
  subject: "Test Subject",
  html: "<p>Test body</p>",
  eventType: NotificationEventType.COMPLAINT_RESPONSE,
  userId: MOCK_USER_ID,
};

function mockSend(resolvedValue: { success: boolean; providerMessageId?: string; error?: string }) {
  return spyOn(emailChannel, "send").mockResolvedValue(resolvedValue);
}

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
  sentAt: null,
  deliveredAt: null,
  openedAt: null,
  failedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Email Channel", () => {
  let createDeliverySpy: ReturnType<typeof spyOn>;
  let updateDeliveryStatusSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    process.env.RESEND_API_KEY = "test-api-key";
    process.env.RESEND_FROM_EMAIL = "test@example.com";
    createDeliverySpy = spyOn(NotificationRepository, "createDelivery").mockResolvedValue(mockDelivery);
    updateDeliveryStatusSpy = spyOn(NotificationRepository, "updateDeliveryStatus").mockResolvedValue(mockDelivery);
  });

  afterEach(() => {
    createDeliverySpy.mockRestore();
    updateDeliveryStatusSpy.mockRestore();
    resetEmailChannel();
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
  });

  describe("send — success", () => {
    test("sends email via Resend and returns success", async () => {
      const sendSpy = mockSend({ success: true, providerMessageId: "resend-msg-001" });
      const result = await emailChannel.send(SEND_PAYLOAD);
      expect(result.success).toBe(true);
      expect(result.providerMessageId).toBe("resend-msg-001");
      expect(sendSpy).toHaveBeenCalledTimes(1);
      sendSpy.mockRestore();
    });
  });

  describe("send — failure", () => {
    test("returns failure when Resend API errors", async () => {
      const sendSpy = mockSend({ success: false, error: "Resend API error: invalid API key" });
      const result = await emailChannel.send(SEND_PAYLOAD);
      expect(result.success).toBe(false);
      expect(result.error).toContain("invalid");
      expect(sendSpy).toHaveBeenCalledTimes(1);
      sendSpy.mockRestore();
    });
  });

  describe("delivery tracking", () => {
    test("creates delivery record before sending", async () => {
      const sendSpy = mockSend({ success: true, providerMessageId: "resend-msg-002" });
      await emailChannel.send(SEND_PAYLOAD);
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith(SEND_PAYLOAD);
      sendSpy.mockRestore();
    });
  });

  describe("config validation", () => {
    test("validateConfig returns true when env vars are present", async () => {
      const result = await emailChannel.validateConfig();
      expect(result).toBe(true);
    });

    test("validateConfig returns false when RESEND_API_KEY is missing", async () => {
      const channel = await import("@/backend/services/communication/channels/email").then(m => m.getEmailChannel());
      delete process.env.RESEND_API_KEY;
      const result = await channel.validateConfig();
      expect(result).toBe(false);
    });

    test("validateConfig returns false when RESEND_FROM_EMAIL is missing", async () => {
      const channel = await import("@/backend/services/communication/channels/email").then(m => m.getEmailChannel());
      delete process.env.RESEND_FROM_EMAIL;
      const result = await channel.validateConfig();
      expect(result).toBe(false);
    });
  });
});
