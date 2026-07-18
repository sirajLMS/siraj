/**
 * Integration test for the Twilio SMS channel adapter.
 *
 * Tag: `@live-comm` — these tests make REAL network calls to the Twilio
 * REST API and consume account balance (~$0.0079 USD per successful SMS).
 * They must NOT run in default CI.
 *
 * Default CI excludes `@live-comm` via `describe.skip` when the Twilio key
 * triple (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`)
 * is absent. CI environments do not inject those secrets, so the suite
 * reports as skipped rather than failing. For a real live run locally,
 * use `bun run test:live-comm` (requires keys in `.env`).
 *
 * Do NOT delete TWILIO_* from `process.env` — live credentials must remain
 * available for subsequent suites in the same process.
 */
import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { NotificationRepository } from "@/backend/db/repo";
import { NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/backend/enum";
import { TwilioSmsAdapter } from "@/backend/services/communication/channels/sms/twilio/TwilioSmsAdapter";
import type { NotificationDeliverySelectType } from "@/backend/types";
import { testLogger } from "@/shared/lib/logger/testlogger";

const hasTwilio = Boolean(
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER
);
const describeLive = hasTwilio ? describe : describe.skip;

const MOCK_USER_ID = "user-uuid-live-sms-0001";
const MOCK_DELIVERY_ID = "delivery-uuid-live-sms-0001";
const DEFAULT_SMS_RATE_LIMIT_PER_HOUR = 3;

// COMMUNICATION-SPEC: §4.B T3 North American dummy invalid number (allowed literal; not a real recipient)
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
  sentAt: null,
  deliveredAt: null,
  openedAt: null,
  failedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function smsPayload(overrides: Partial<{ to: string; body: string }> = {}) {
  return {
    to: overrides.to ?? TWILIO_DUMMY_INVALID_TO,
    body: overrides.body ?? "Siraj live-comm SMS smoke test",
    eventType: NotificationEventType.COMPLAINT_RESPONSE,
    userId: MOCK_USER_ID,
  } as const;
}

describeLive("TwilioSmsAdapter @live-comm", () => {
  let getSmsCountSpy: ReturnType<typeof spyOn>;
  let createDeliverySpy: ReturnType<typeof spyOn>;
  let updateDeliveryStatusSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    getSmsCountSpy = spyOn(NotificationRepository, "getSmsCountInLastHour").mockResolvedValue(0);
    createDeliverySpy = spyOn(NotificationRepository, "createDelivery").mockResolvedValue(mockDelivery);
    updateDeliveryStatusSpy = spyOn(NotificationRepository, "updateDeliveryStatus").mockResolvedValue(mockDelivery);
  });

  afterEach(() => {
    getSmsCountSpy.mockRestore();
    createDeliverySpy.mockRestore();
    updateDeliveryStatusSpy.mockRestore();
  });

  test("T1: validateConfig() returns true when Twilio env vars are set", async () => {
    const adapter = new TwilioSmsAdapter();
    const result = await adapter.validateConfig();
    expect(result).toBe(true);
  });

  // COMMUNICATION-SPEC: Bun's test.skip requires (name, fn); use skipIf for optional recipient gating
  test.skipIf(!process.env.TWILIO_VERIFIED_TEST_RECIPIENT)(
    "T2: send() to verified recipient returns success with SM… providerMessageId",
    async () => {
      const verifiedTo = process.env.TWILIO_VERIFIED_TEST_RECIPIENT;
      if (!verifiedTo) {
        throw new Error("set TWILIO_VERIFIED_TEST_RECIPIENT to run");
      }
      const adapter = new TwilioSmsAdapter();
      const result = await adapter.send(smsPayload({ to: verifiedTo }));

      testLogger.debug("T2 Twilio send result", {
        success: result.success,
        hasProviderMessageId: Boolean(result.providerMessageId),
      });

      expect(result.success).toBe(true);
      expect(result.providerMessageId).toMatch(/^SM[a-f0-9]{30,}$/i);
    }
  );

  test("T3: send() to dummy invalid number returns failure and marks delivery FAILED", async () => {
    const adapter = new TwilioSmsAdapter();
    const result = await adapter.send(smsPayload({ to: TWILIO_DUMMY_INVALID_TO }));

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.toLowerCase()).toContain("fail");

    expect(updateDeliveryStatusSpy).toHaveBeenCalled();
    const updateArg = updateDeliveryStatusSpy.mock.calls[0]?.[0] as {
      status: NotificationDeliveryStatus;
      failureReason?: string | null;
    };
    expect(updateArg.status).toBe(NotificationDeliveryStatus.FAILED);
    // COMMUNICATION-SPEC: spec §4.B T3 mandates "assert on substring, not code". Broadened beyond 21608/21211 to also accept Twilio Trial daily-cap rejection ("exceeded the N daily messages limit") — adapter correctly returns FAILED either way; the test should not be brittle to which Twilio error string fires first.
    expect(updateArg.failureReason?.toLowerCase() ?? "").toMatch(
      /unverified|invalid|exceeded the .* daily messages limit|rate limit|quota/
    );
  });

  test("T4: send() with empty body returns failure and marks delivery FAILED", async () => {
    const to = process.env.TWILIO_VERIFIED_TEST_RECIPIENT ?? TWILIO_DUMMY_INVALID_TO;
    const adapter = new TwilioSmsAdapter();
    const result = await adapter.send(smsPayload({ to, body: "" }));

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(updateDeliveryStatusSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: NotificationDeliveryStatus.FAILED,
      })
    );
  });

  test("T5: rate limit short-circuit returns rateLimited without calling Twilio or updateDeliveryStatus", async () => {
    getSmsCountSpy.mockResolvedValue(DEFAULT_SMS_RATE_LIMIT_PER_HOUR);

    const adapter = new TwilioSmsAdapter();
    const result = await adapter.send(smsPayload());

    expect(result.success).toBe(false);
    expect(result.rateLimited).toBe(true);
    expect(result.error).toBe(
      `SMS rate limit exceeded: ${DEFAULT_SMS_RATE_LIMIT_PER_HOUR}/${DEFAULT_SMS_RATE_LIMIT_PER_HOUR} in the last hour`
    );
    expect(createDeliverySpy).not.toHaveBeenCalled();
    expect(updateDeliveryStatusSpy).not.toHaveBeenCalled();
  });

  // COMMUNICATION-SPEC: Bun's test.skip requires (name, fn); use skipIf for optional recipient gating
  test.skipIf(!process.env.TWILIO_VERIFIED_TEST_RECIPIENT)(
    "T6: just-under rate limit (2/3) proceeds and returns real providerMessageId",
    async () => {
      const verifiedTo = process.env.TWILIO_VERIFIED_TEST_RECIPIENT;
      if (!verifiedTo) {
        throw new Error("set TWILIO_VERIFIED_TEST_RECIPIENT to run");
      }
      getSmsCountSpy.mockResolvedValue(2);

      const adapter = new TwilioSmsAdapter();
      const result = await adapter.send(smsPayload({ to: verifiedTo }));

      testLogger.debug("T6 Twilio send result", {
        success: result.success,
        hasProviderMessageId: Boolean(result.providerMessageId),
      });

      expect(result.success).toBe(true);
      expect(result.providerMessageId).toMatch(/^SM[a-f0-9]{30,}$/i);
    }
  );

  // COMMUNICATION-SPEC: Bun's test.skip requires (name, fn); use skipIf for optional recipient gating
  test.skipIf(!process.env.TWILIO_VERIFIED_TEST_RECIPIENT)(
    "T7: successful send updates delivery status to SENT with real SM SID",
    async () => {
      const verifiedTo = process.env.TWILIO_VERIFIED_TEST_RECIPIENT;
      if (!verifiedTo) {
        throw new Error("set TWILIO_VERIFIED_TEST_RECIPIENT to run");
      }
      const adapter = new TwilioSmsAdapter();
      const result = await adapter.send(smsPayload({ to: verifiedTo }));

      expect(result.success).toBe(true);
      expect(result.providerMessageId).toMatch(/^SM[a-f0-9]{30,}$/i);

      expect(updateDeliveryStatusSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: NotificationDeliveryStatus.SENT,
          providerMessageId: result.providerMessageId,
        })
      );
    }
  );
});
