import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { NotificationRepository } from "@/backend/db/repo";
import { NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/backend/enum";
import { resetEnvironmentCache } from "@/backend/lib/env";
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
  metadata: null,
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
    resetSmsChannel();
    resetEnvironmentCache();
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

  describe("send — empty recipient guard", () => {
    test("returns failure with 'empty recipient address' when `to` is empty string", async () => {
      // Do NOT spy on the facade `smsChannel.send` — that would bypass the
      // real adapter and its guard. Let the facade delegate to the real
      // `TwilioSmsAdapter.send`; the guard short-circuits before the rate-limit
      // check or the Twilio client is ever touched, so no network call happens.
      const result = await smsChannel.send({ ...sendParams(), to: "" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("empty recipient address");
      // Rate-limit check is skipped (guard runs before it).
      expect(getSmsCountSpy).not.toHaveBeenCalled();
      // A FAILED delivery row is still recorded for the audit trail.
      expect(createDeliverySpy).toHaveBeenCalled();
      expect(updateDeliveryStatusSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: NotificationDeliveryStatus.FAILED,
          failureReason: "empty recipient address",
        })
      );
    });

    test("returns failure when `to` is whitespace-only", async () => {
      const result = await smsChannel.send({ ...sendParams(), to: "   " });

      expect(result.success).toBe(false);
      expect(result.error).toBe("empty recipient address");
      expect(getSmsCountSpy).not.toHaveBeenCalled();
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
      resetEnvironmentCache();
      const result = await channel.validateConfig();
      expect(result).toBe(false);
    });

    test("validateConfig returns false when TWILIO_AUTH_TOKEN is missing", async () => {
      const channel = await import("@/backend/services/communication/channels/sms").then(m => m.getSmsChannel());
      delete process.env.TWILIO_AUTH_TOKEN;
      resetEnvironmentCache();
      const result = await channel.validateConfig();
      expect(result).toBe(false);
    });

    test("validateConfig returns false when TWILIO_FROM_NUMBER is missing", async () => {
      const channel = await import("@/backend/services/communication/channels/sms").then(m => m.getSmsChannel());
      delete process.env.TWILIO_FROM_NUMBER;
      resetEnvironmentCache();
      const result = await channel.validateConfig();
      expect(result).toBe(false);
    });
  });
});
