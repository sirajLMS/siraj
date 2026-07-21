/**
 * Integration test for the Resend email channel adapter.
 *
 * Tag: `@live-comm` — these tests make REAL network calls to the Resend API
 * and may consume provider quota / incur cost. They must NOT run in default CI.
 *
 * Default CI excludes `@live-comm` via `describe.skip` when `RESEND_API_KEY`
 * or `RESEND_FROM_EMAIL` is absent. CI environments do not inject those
 * secrets, so the suite reports as skipped rather than failing. For a real
 * live run locally, use `bun run test:live-comm` (requires keys in `.env`).
 */
import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { NotificationRepository } from "@/backend/db/repo";
import { NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/backend/enum";
import { ResendEmailAdapter } from "@/backend/services/communication/channels/email/resend/ResendEmailAdapter";
import type { NotificationDeliverySelectType } from "@/backend/types";
import { testLogger } from "@/shared/lib/logger/testlogger";

const hasResend = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
const describeLive = hasResend ? describe : describe.skip;

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

function basePayload(to: string) {
  return {
    to,
    subject: "Siraj live-comm Resend probe",
    html: "<p>live-comm integration probe</p>",
    eventType: NotificationEventType.COMPLAINT_RESPONSE,
    userId: MOCK_USER_ID,
  };
}

describeLive("ResendEmailAdapter @live-comm", () => {
  let createDeliverySpy: ReturnType<typeof spyOn>;
  let updateDeliveryStatusSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    createDeliverySpy = spyOn(NotificationRepository, "createDelivery").mockResolvedValue(mockDelivery);
    updateDeliveryStatusSpy = spyOn(NotificationRepository, "updateDeliveryStatus").mockResolvedValue(mockDelivery);
  });

  afterEach(() => {
    createDeliverySpy.mockRestore();
    updateDeliveryStatusSpy.mockRestore();
  });

  // E1
  test("validateConfig() returns true when RESEND_* env vars are set", async () => {
    const adapter = new ResendEmailAdapter();
    const result = await adapter.validateConfig();
    expect(result).toBe(true);
  });

  // E2 — skip message: "set RESEND_TEST_TO_EMAIL to run"
  test.skipIf(!process.env.RESEND_TEST_TO_EMAIL)(
    "send() to RESEND_TEST_TO_EMAIL returns success with Resend message id",
    async () => {
      const to = process.env.RESEND_TEST_TO_EMAIL;
      if (!to) {
        throw new Error("set RESEND_TEST_TO_EMAIL to run");
      }

      const adapter = new ResendEmailAdapter();
      const result = await adapter.send(basePayload(to));

      testLogger.debug("Resend E2 result", {
        success: result.success,
        providerMessageId: result.providerMessageId,
      });

      expect(result.success).toBe(true);
      expect(typeof result.providerMessageId).toBe("string");
      expect(result.providerMessageId).toMatch(RESEND_MESSAGE_ID_RE);
    }
  );

  async function sendAndAssertSent(to: string) {
    const adapter = new ResendEmailAdapter();
    const result = await adapter.send(basePayload(to));

    expect(result.success).toBe(true);
    expect(result.providerMessageId).toMatch(RESEND_MESSAGE_ID_RE);
    expect(updateDeliveryStatusSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: NotificationDeliveryStatus.SENT,
        providerMessageId: result.providerMessageId,
      })
    );
  }

  // E3
  // COMMUNICATION-SPEC: Resend simulator addresses are accepted by the send API
  // (success + message id). Bounce/complaint/suppression arrive asynchronously via
  // webhooks — out of scope for adapter send() tests. Assert SENT path instead.
  test("send() to bounced@resend.dev is accepted by Resend API (webhook bounce is async)", async () => {
    await sendAndAssertSent("bounced@resend.dev");
  });

  // E4
  // COMMUNICATION-SPEC: same as E3 — complained@resend.dev is API-accepted; complaint is webhook-async
  test("send() to complained@resend.dev is accepted by Resend API (webhook complaint is async)", async () => {
    await sendAndAssertSent("complained@resend.dev");
  });

  // E5
  // COMMUNICATION-SPEC: same as E3 — suppressed@resend.dev is API-accepted (or treated as deliverable by send API)
  test("send() to suppressed@resend.dev is accepted by Resend API (webhook suppression is async)", async () => {
    await sendAndAssertSent("suppressed@resend.dev");
  });

  // E6 — skip message: "set RESEND_TEST_TO_EMAIL to run"
  test.skipIf(!process.env.RESEND_TEST_TO_EMAIL)(
    "send() twice yields two different providerMessageIds (no idempotencyKey)",
    async () => {
      const to = process.env.RESEND_TEST_TO_EMAIL;
      if (!to) {
        throw new Error("set RESEND_TEST_TO_EMAIL to run");
      }

      const adapter = new ResendEmailAdapter();
      const payload = basePayload(to);
      const first = await adapter.send(payload);
      const second = await adapter.send(payload);

      expect(first.success).toBe(true);
      expect(second.success).toBe(true);
      expect(typeof first.providerMessageId).toBe("string");
      expect(typeof second.providerMessageId).toBe("string");
      // REAL-PROVIDER-SPEC: adapter does not pass idempotencyKey (codifies today's non-idempotent behavior; will fail loudly if a future refactor adds idempotencyKey)
      expect(first.providerMessageId).not.toBe(second.providerMessageId);
    }
  );

  // E7 — skip message: "set RESEND_TEST_TO_EMAIL to run"
  test.skipIf(!process.env.RESEND_TEST_TO_EMAIL)(
    "successful send updates delivery status to SENT with providerMessageId",
    async () => {
      const to = process.env.RESEND_TEST_TO_EMAIL;
      if (!to) {
        throw new Error("set RESEND_TEST_TO_EMAIL to run");
      }

      const adapter = new ResendEmailAdapter();
      const result = await adapter.send(basePayload(to));

      expect(result.success).toBe(true);
      expect(typeof result.providerMessageId).toBe("string");

      const calls = updateDeliveryStatusSpy.mock.calls as unknown as Array<
        [{ status: string; providerMessageId?: string | null }]
      >;
      const sentCall = calls.find(c => c[0]?.status === NotificationDeliveryStatus.SENT);
      expect(sentCall).toBeDefined();
      expect(sentCall?.[0]?.providerMessageId).toBe(result.providerMessageId);
    }
  );

  // E8 — skip message: "set RESEND_TEST_TO_EMAIL to run"
  test.skipIf(!process.env.RESEND_TEST_TO_EMAIL)(
    "createDelivery call count equals send count (no phantom writes)",
    async () => {
      const to = process.env.RESEND_TEST_TO_EMAIL;
      if (!to) {
        throw new Error("set RESEND_TEST_TO_EMAIL to run");
      }

      const adapter = new ResendEmailAdapter();
      const payload = basePayload(to);

      await adapter.send(payload);
      await adapter.send(payload);
      const sendCount = 2;

      expect(createDeliverySpy.mock.calls).toHaveLength(sendCount);
    }
  );
});
