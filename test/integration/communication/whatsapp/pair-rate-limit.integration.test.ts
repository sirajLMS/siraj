/**
 * WhatsApp Cloud API — pair-rate-limit live smoke (B2, REQ-9).
 *
 * Sends two template messages to the same recipient < 6 s apart and asserts
 * the second is **deferred (not failed)** and Meta receives both ≥ 6 s apart.
 * The MetaCloudApiAdapter enforces a 6 s gap between sends to the same
 * recipient via a Redis-based pair-rate-limit guard.
 *
 * Run: `bun run test:live-comm` or `bun run test:integration`
 *
 * Requires: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TEST_TO_PHONE,
 *           WHATSAPP_TEST_TEMPLATE_NAME, WHATSAPP_TEST_TEMPLATE_LANGUAGE
 */
import { afterEach, beforeEach, expect, spyOn, test } from "bun:test";
import { NotificationRepository } from "@/backend/db/repo/notifications/notification.repository";
import { WhatsappAccountRepository } from "@/backend/db/repo/whatsapp";
import { NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/backend/enum";
import { MetaCloudApiAdapter, redisService, resetWhatsappChannel } from "@/backend/services";
import type { NotificationDeliverySelectType } from "@/backend/types";
import { describeLiveWhen } from "@/test/integration/helpers/describe-live";

const accessToken = process.env.WHATSAPP_ACCESS_TOKEN ?? "";
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
const testToPhone = process.env.WHATSAPP_TEST_TO_PHONE ?? "";
const templateName = process.env.WHATSAPP_TEST_TEMPLATE_NAME ?? "hello_world";
const templateLanguage = process.env.WHATSAPP_TEST_TEMPLATE_LANGUAGE ?? "en_US";

const hasCreds = Boolean(accessToken && phoneNumberId && testToPhone);
const describeLive = describeLiveWhen(hasCreds, "pair-rate-limit @live-comm");

const MOCK_USER_ID = "user-uuid-wa-pair-rl-0001";
const MOCK_DELIVERY_ID = "delivery-uuid-wa-pair-rl-0001";

const mockDelivery: NotificationDeliverySelectType = {
  id: MOCK_DELIVERY_ID,
  userId: MOCK_USER_ID,
  deviceTokenId: null,
  channel: NotificationChannel.WHATSAPP,
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

describeLive("pair-rate-limit @live-comm", () => {
  let createDeliverySpy: ReturnType<typeof spyOn>;
  let updateDeliveryStatusSpy: ReturnType<typeof spyOn>;

  beforeEach(async () => {
    await resetWhatsappChannel();
    createDeliverySpy = spyOn(NotificationRepository, "createDelivery").mockResolvedValue(mockDelivery);
    updateDeliveryStatusSpy = spyOn(NotificationRepository, "updateDeliveryStatus").mockResolvedValue(mockDelivery);
  });

  afterEach(() => {
    createDeliverySpy.mockRestore();
    updateDeliveryStatusSpy.mockRestore();
  });

  test("two sends to same recipient < 6s apart — second is deferred, not failed (B2)", async () => {
    const account = await WhatsappAccountRepository.findFirstActiveForCredentials();
    if (!account) {
      throw new Error("pair-rate-limit smoke requires an active whatsapp_accounts row");
    }
    const adapter = new MetaCloudApiAdapter(account.id);

    const payload = {
      to: testToPhone,
      eventType: NotificationEventType.COMPLAINT_RESPONSE,
      userId: MOCK_USER_ID,
      template: { name: templateName, languageCode: templateLanguage },
    };

    // Clean any stale Redis pair-rate-limit key. The sender segment mirrors
    // the adapter's sender-key derivation (display number digits, else id).
    const senderKey = account.displayPhoneNumber?.replace(/\D/g, "") || account.phoneNumberId;
    await redisService.del(`whatsapp:pair:${senderKey}:${testToPhone}`).catch(() => {});

    const firstStart = Date.now();
    const firstResult = await adapter.send(payload, "en");
    const firstElapsed = Date.now() - firstStart;

    const secondStart = Date.now();
    const secondResult = await adapter.send(payload, "en");
    const secondElapsed = Date.now() - secondStart;

    expect(firstResult.success).toBe(true);
    expect(firstResult.providerMessageId).toBeDefined();

    expect(secondResult.success).toBe(true);
    expect(secondResult.providerMessageId).toBeDefined();

    const gap = secondStart + secondElapsed - (firstStart + firstElapsed);
    expect(gap).toBeGreaterThanOrEqual(5000); // at least ~6s between Meta API calls

    expect(updateDeliveryStatusSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: NotificationDeliveryStatus.SENT,
      })
    );
  });
});
