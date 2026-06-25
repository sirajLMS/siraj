import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { OnAppChannel } from "@/backend/services";
import { emailChannel } from "@/backend/services/communication/channels/email";
import { pushChannel } from "@/backend/services/communication/channels/push";
import { smsChannel } from "@/backend/services/communication/channels/sms";
import { CommunicationService } from "@/backend/services/communication/communication.service";
import type { CommunicationPayload } from "@/backend/types";
import { NotificationEventType } from "@/shared/lib/enum";

const MOCK_USER_ID = "user-uuid-0001";

describe("CommunicationService", () => {
  let onAppSendSpy: ReturnType<typeof spyOn>;
  let emailSendSpy: ReturnType<typeof spyOn>;
  let smsSendSpy: ReturnType<typeof spyOn>;
  let pushSendSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    onAppSendSpy = spyOn(OnAppChannel, "send").mockResolvedValue(undefined);
    emailSendSpy = spyOn(emailChannel, "send").mockResolvedValue({ success: true, providerMessageId: "test" });
    smsSendSpy = spyOn(smsChannel, "send").mockResolvedValue({ success: true, providerMessageId: "test" });
    pushSendSpy = spyOn(pushChannel, "send").mockResolvedValue({ success: true, successCount: 1, failureCount: 0 });
  });

  afterEach(() => {
    onAppSendSpy.mockRestore();
    emailSendSpy.mockRestore();
    smsSendSpy.mockRestore();
    pushSendSpy.mockRestore();
  });

  describe("dispatch — routes to correct channel", () => {
    test("routes on_app payload to OnAppChannel", async () => {
      const result = await CommunicationService.dispatch({
        userId: MOCK_USER_ID,
        channel: "on_app",
        eventType: NotificationEventType.COMPLAINT_RESPONSE,
        title: "Test",
        body: "Test body",
      });

      expect(result.channel).toBe("on_app");
      expect(result.success).toBe(true);
      expect(onAppSendSpy).toHaveBeenCalledTimes(1);
    });

    test("routes email payload to emailChannel", async () => {
      emailSendSpy.mockResolvedValue({ success: true, providerMessageId: "email-001" });

      const result = await CommunicationService.dispatch({
        userId: MOCK_USER_ID,
        channel: "email",
        eventType: NotificationEventType.COMPLAINT_RESPONSE,
        title: "Test",
        body: "Test body",
        metadata: { to: "user@test.com" },
      });

      expect(result.channel).toBe("email");
      expect(result.success).toBe(true);
      expect(result.providerMessageId).toBe("email-001");
    });

    test("routes sms payload to smsChannel", async () => {
      smsSendSpy.mockResolvedValue({ success: true, providerMessageId: "sms-001" });

      const result = await CommunicationService.dispatch({
        userId: MOCK_USER_ID,
        channel: "sms",
        eventType: NotificationEventType.COMPLAINT_RESPONSE,
        title: "Test",
        body: "Test body",
        metadata: { to: "+1234567890" },
      });

      expect(result.channel).toBe("sms");
      expect(result.success).toBe(true);
      expect(result.providerMessageId).toBe("sms-001");
    });

    test("routes push payload to pushChannel", async () => {
      const result = await CommunicationService.dispatch({
        userId: MOCK_USER_ID,
        channel: "push",
        eventType: NotificationEventType.COMPLAINT_RESPONSE,
        title: "Test",
        body: "Test body",
      });

      expect(result.channel).toBe("push");
      expect(result.success).toBe(true);
    });
  });

  describe("dispatchMulti — all succeed", () => {
    test("returns all success results", async () => {
      emailSendSpy.mockResolvedValue({ success: true, providerMessageId: "email-multi-001" });

      const payloads: CommunicationPayload[] = [
        {
          userId: MOCK_USER_ID,
          channel: "on_app",
          eventType: NotificationEventType.COMPLAINT_RESPONSE,
          title: "Response",
          body: "Body",
        },
        {
          userId: MOCK_USER_ID,
          channel: "email",
          eventType: NotificationEventType.COMPLAINT_RESPONSE,
          title: "Response",
          body: "Body",
          metadata: { to: "user@test.com" },
        },
      ];

      const results = await CommunicationService.dispatchMulti(payloads);

      expect(results).toBeArray();
      expect(results.length).toBe(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });
  });

  describe("dispatchMulti — partial failure", () => {
    test("returns mixed results and does not block other channels", async () => {
      emailSendSpy.mockResolvedValue({ success: false, error: "Email provider down" });

      const payloads: CommunicationPayload[] = [
        {
          userId: MOCK_USER_ID,
          channel: "on_app",
          eventType: NotificationEventType.COMPLAINT_RESPONSE,
          title: "Test",
          body: "Body",
        },
        {
          userId: MOCK_USER_ID,
          channel: "email",
          eventType: NotificationEventType.COMPLAINT_RESPONSE,
          title: "Test",
          body: "Body",
          metadata: { to: "user@test.com" },
        },
      ];

      const results = await CommunicationService.dispatchMulti(payloads);

      expect(results.length).toBe(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toContain("provider down");
    });
  });

  describe("dispatchMulti — all fail", () => {
    test("returns all failure results", async () => {
      onAppSendSpy.mockRejectedValue(new Error("OnApp service unavailable"));
      smsSendSpy.mockResolvedValue({ success: false, error: "SMS service unavailable" });

      const payloads: CommunicationPayload[] = [
        {
          userId: MOCK_USER_ID,
          channel: "on_app",
          eventType: NotificationEventType.COMPLAINT_RESPONSE,
          title: "Test",
          body: "Body",
        },
        {
          userId: MOCK_USER_ID,
          channel: "sms",
          eventType: NotificationEventType.COMPLAINT_RESPONSE,
          title: "Test",
          body: "Body",
          metadata: { to: "+1234567890" },
        },
      ];

      const results = await CommunicationService.dispatchMulti(payloads);

      expect(results.length).toBe(2);
      expect(results[0].success).toBe(false);
      expect(results[1].success).toBe(false);
    });
  });

  describe("dispatchMulti — empty array", () => {
    test("returns empty array for no payloads", async () => {
      const results = await CommunicationService.dispatchMulti([]);

      expect(results).toBeArray();
      expect(results.length).toBe(0);
    });
  });

  describe("exhaustive switch check", () => {
    test("dispatch handles all known channel types without falling through", async () => {
      const channels: Array<CommunicationPayload["channel"]> = ["on_app", "email", "sms", "push"];

      for (const channel of channels) {
        const result = await CommunicationService.dispatch({
          userId: MOCK_USER_ID,
          channel,
          eventType: NotificationEventType.COMPLAINT_RESPONSE,
          title: "Test",
          body: "Body",
          metadata: { to: "test@test.com" },
        });

        expect(result.channel).toBe(channel);
      }
    });
  });
});
