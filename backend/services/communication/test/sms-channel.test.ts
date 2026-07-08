import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { NotificationRepository } from "@/backend/db/repo";
import { NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/backend/enum";
import { resetSmsChannel, smsChannel } from "@/backend/services/communication/channels/sms";
import type { NotificationDeliverySelectType } from "@/backend/types";

const MOCK_USER_ID = "user-uuid-0001";
const MOCK_DELIVERY_ID = "delivery-uuid-0001";

function sendParams() {
  return {
    to: "+1234567890",
    body: "Test SMS body",
    eventType: NotificationEventType.COMPLAINT_RESPONSE,
    userId: MOCK_USER_ID,
  } as const;
}

function mockSend(result: { success: boolean; providerMessageId?: string; error?: string }) {
  return spyOn(smsChannel, "send").mockResolvedValue(result);
}

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
  sentAt: null,
  deliveredAt: null,
  openedAt: null,
  failedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("SMS Channel", () => {
  let getSmsCountSpy: ReturnType<typeof spyOn>;
  let createDeliverySpy: ReturnType<typeof spyOn>;
  let updateDeliveryStatusSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    process.env.TWILIO_ACCOUNT_SID = "ACtest-sid-1234567890";
    process.env.TWILIO_AUTH_TOKEN = "test-token";
    process.env.TWILIO_FROM_NUMBER = "+1234567890";
    getSmsCountSpy = spyOn(NotificationRepository, "getSmsCountInLastHour").mockResolvedValue(0);
    createDeliverySpy = spyOn(NotificationRepository, "createDelivery").mockResolvedValue(mockDelivery);
    updateDeliveryStatusSpy = spyOn(NotificationRepository, "updateDeliveryStatus").mockResolvedValue(mockDelivery);
  });

  afterEach(() => {
    getSmsCountSpy.mockRestore();
    createDeliverySpy.mockRestore();
    updateDeliveryStatusSpy.mockRestore();
    resetSmsChannel();
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_FROM_NUMBER;
  });

  describe("send — success", () => {
    test("sends SMS via Twilio and returns success", async () => {
      const sendSpy = mockSend({ success: true, providerMessageId: "twilio-sid-001" });

      const result = await smsChannel.send(sendParams());

      expect(result.success).toBe(true);
      expect(result.providerMessageId).toBe("twilio-sid-001");
      expect(sendSpy).toHaveBeenCalledTimes(1);
      sendSpy.mockRestore();
    });
  });

  describe("send — failure", () => {
    test("returns failure when Twilio API errors", async () => {
      const sendSpy = mockSend({ success: false, error: "Twilio API error: invalid phone number" });

      const result = await smsChannel.send(sendParams());

      expect(result.success).toBe(false);
      expect(result.error).toContain("invalid");
      expect(sendSpy).toHaveBeenCalledTimes(1);
      sendSpy.mockRestore();
    });
  });

  describe("rate limiting", () => {
    test("returns failure when rate limit exceeded (3/hour)", async () => {
      getSmsCountSpy.mockResolvedValue(3);

      const result = await smsChannel.send(sendParams());

      expect(result.success).toBe(false);
      expect(result.rateLimited).toBe(true);
      expect(result.error).toContain("rate limit");
      expect(createDeliverySpy).not.toHaveBeenCalled();
    });

    test("allows SMS when under rate limit", async () => {
      getSmsCountSpy.mockResolvedValue(2);
      const sendSpy = mockSend({ success: true, providerMessageId: "twilio-sid-002" });

      const result = await smsChannel.send(sendParams());

      expect(result.success).toBe(true);
      expect(sendSpy).toHaveBeenCalledTimes(1);
      sendSpy.mockRestore();
    });
  });

  describe("config validation", () => {
    test("validateConfig returns true when env vars are present", async () => {
      const result = await smsChannel.validateConfig();
      expect(result).toBe(true);
    });

    test("validateConfig returns false when TWILIO_ACCOUNT_SID is missing", async () => {
      const channel = await import("@/backend/services/communication/channels/sms").then(m => m.getSmsChannel());
      delete process.env.TWILIO_ACCOUNT_SID;
      const result = await channel.validateConfig();
      expect(result).toBe(false);
    });

    test("validateConfig returns false when TWILIO_AUTH_TOKEN is missing", async () => {
      const channel = await import("@/backend/services/communication/channels/sms").then(m => m.getSmsChannel());
      delete process.env.TWILIO_AUTH_TOKEN;
      const result = await channel.validateConfig();
      expect(result).toBe(false);
    });

    test("validateConfig returns false when TWILIO_FROM_NUMBER is missing", async () => {
      const channel = await import("@/backend/services/communication/channels/sms").then(m => m.getSmsChannel());
      delete process.env.TWILIO_FROM_NUMBER;
      const result = await channel.validateConfig();
      expect(result).toBe(false);
    });
  });
});
