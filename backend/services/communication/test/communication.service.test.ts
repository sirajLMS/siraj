import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { NotificationChannel, NotificationEventType } from "@/backend/enum";
import { OnAppChannel } from "@/backend/services";
import { emailChannel } from "@/backend/services/communication/channels/email";
import { pushChannel } from "@/backend/services/communication/channels/push";
import { smsChannel } from "@/backend/services/communication/channels/sms";
import { CommunicationService } from "@/backend/services/communication/communication.service";
import type { ChannelDispatchResult, CommunicationPayload } from "@/backend/types";

const MOCK_USER_ID = "user-uuid-0001";

function createTestPayload(overrides?: Partial<CommunicationPayload>): CommunicationPayload {
  return {
    userId: MOCK_USER_ID,
    channel: NotificationChannel.ON_APP,
    eventType: NotificationEventType.COMPLAINT_RESPONSE,
    title: "Test",
    body: "Test body",
    ...overrides,
  };
}

function expectDispatchSuccess(result: ChannelDispatchResult, channel: CommunicationPayload["channel"]) {
  expect(result.channel).toBe(channel);
  expect(result.success).toBe(true);
}

function expectDispatchFailure(result: ChannelDispatchResult, errorContains?: string) {
  expect(result.success).toBe(false);
  if (errorContains) {
    expect(result.error).toContain(errorContains);
  }
}

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
      const result = await CommunicationService.dispatch(createTestPayload());

      expectDispatchSuccess(result, NotificationChannel.ON_APP);
      expect(onAppSendSpy).toHaveBeenCalledTimes(1);
    });

    test("routes email payload to emailChannel", async () => {
      emailSendSpy.mockResolvedValue({ success: true, providerMessageId: "email-001" });

      const result = await CommunicationService.dispatch(
        createTestPayload({ channel: NotificationChannel.EMAIL, metadata: { to: "user@test.com" } })
      );

      expectDispatchSuccess(result, NotificationChannel.EMAIL);
      expect(result.providerMessageId).toBe("email-001");
    });

    test("routes sms payload to smsChannel", async () => {
      smsSendSpy.mockResolvedValue({ success: true, providerMessageId: "sms-001" });

      const result = await CommunicationService.dispatch(
        createTestPayload({ channel: NotificationChannel.SMS, metadata: { to: "+1234567890" } })
      );

      expectDispatchSuccess(result, NotificationChannel.SMS);
      expect(result.providerMessageId).toBe("sms-001");
    });

    test("routes push payload to pushChannel", async () => {
      const result = await CommunicationService.dispatch(createTestPayload({ channel: NotificationChannel.PUSH }));

      expectDispatchSuccess(result, NotificationChannel.PUSH);
    });
  });

  describe("dispatchMulti — all succeed", () => {
    test("returns all success results", async () => {
      emailSendSpy.mockResolvedValue({ success: true, providerMessageId: "email-multi-001" });

      const payloads: CommunicationPayload[] = [
        createTestPayload({ title: "Response", body: "Body" }),
        createTestPayload({
          channel: NotificationChannel.EMAIL,
          title: "Response",
          body: "Body",
          metadata: { to: "user@test.com" },
        }),
      ];

      const results = await CommunicationService.dispatchMulti(payloads);

      expect(results).toBeArray();
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });
  });

  describe("dispatchMulti — partial failure", () => {
    test("returns mixed results and does not block other channels", async () => {
      emailSendSpy.mockResolvedValue({ success: false, error: "Email provider down" });

      const payloads: CommunicationPayload[] = [
        createTestPayload({ body: "Body" }),
        createTestPayload({ channel: NotificationChannel.EMAIL, body: "Body", metadata: { to: "user@test.com" } }),
      ];

      const results = await CommunicationService.dispatchMulti(payloads);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expectDispatchFailure(results[1], "provider down");
    });
  });

  describe("dispatchMulti — all fail", () => {
    test("returns all failure results", async () => {
      onAppSendSpy.mockRejectedValue(new Error("OnApp service unavailable"));
      smsSendSpy.mockResolvedValue({ success: false, error: "SMS service unavailable" });

      const payloads: CommunicationPayload[] = [
        createTestPayload({ body: "Body" }),
        createTestPayload({ channel: NotificationChannel.SMS, body: "Body", metadata: { to: "+1234567890" } }),
      ];

      const results = await CommunicationService.dispatchMulti(payloads);

      expect(results).toHaveLength(2);
      expectDispatchFailure(results[0]);
      expectDispatchFailure(results[1]);
    });
  });

  describe("dispatchMulti — empty array", () => {
    test("returns empty array for no payloads", async () => {
      const results = await CommunicationService.dispatchMulti([]);

      expect(results).toBeArray();
      expect(results).toHaveLength(0);
    });
  });

  describe("exhaustive switch check", () => {
    test("dispatch handles all known channel types without falling through", async () => {
      const channels: Array<CommunicationPayload["channel"]> = [
        NotificationChannel.ON_APP,
        NotificationChannel.EMAIL,
        NotificationChannel.SMS,
        NotificationChannel.PUSH,
      ];

      const results = await Promise.all(
        channels.map(async channel => {
          const innerResult = await CommunicationService.dispatch(
            createTestPayload({ channel, body: "Body", metadata: { to: "test@test.com" } })
          );
          return { channel, result: innerResult };
        })
      );

      for (const { channel, result } of results) {
        expect(result.channel).toBe(channel);
      }
    });
  });
});
