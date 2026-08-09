import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { NotificationRepository, WhatsappAccountRepository } from "@/backend/db/repo";
import { NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/backend/enum";
import {
  getWhatsappChannel,
  resetWhatsappChannel,
  whatsappChannel,
} from "@/backend/services/communication/channels/whatsapp";
import { redisService } from "@/backend/services/redis";
import { invalidateEnvConfigCache } from "@/backend/services/system";
import type { NotificationDeliverySelectType } from "@/backend/types";
import type { WhatsappAccountSelectType } from "@/backend/types/whatsapp/whatsapp-account.types";

const MOCK_USER_ID = "user-uuid-wa-0001";
const MOCK_DELIVERY_ID = "delivery-uuid-wa-0001";
const MOCK_ACCOUNT_ID = "11111111-1111-4111-8111-111111111111";

function sendParams() {
  return {
    to: "1234567890",
    eventType: NotificationEventType.COMPLAINT_RESPONSE,
    userId: MOCK_USER_ID,
    template: { name: "test_template", languageCode: "en" },
  };
}

function mockWhatsappCredentialsAccount(overrides: Partial<WhatsappAccountSelectType> = {}): WhatsappAccountSelectType {
  return {
    id: MOCK_ACCOUNT_ID,
    wabaId: "waba-0001",
    phoneNumberId: "phone-id-123",
    displayName: { en: "Test Account" },
    displayPhoneNumber: null,
    qualityRating: null,
    portfolioMessagingLimitTier: null,
    throughputLevel: null,
    maxPhoneNumbersPerBusiness: null,
    encryptedAccessToken: "test-token-abc123",
    encryptedTwoStepPin: "pin-000",
    isActive: true,
    lastWebhookAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function mockFetchResponse(body: Record<string, unknown>, status: number) {
  return spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

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

describe("WhatsApp Channel Factory", () => {
  let createDeliverySpy: ReturnType<typeof spyOn>;
  let updateDeliveryStatusSpy: ReturnType<typeof spyOn>;
  let findFirstActiveForCredentialsSpy: ReturnType<typeof spyOn>;

  beforeEach(async () => {
    await resetWhatsappChannel();
    invalidateEnvConfigCache();
    findFirstActiveForCredentialsSpy = spyOn(
      WhatsappAccountRepository,
      "findFirstActiveForCredentials"
    ).mockResolvedValue(mockWhatsappCredentialsAccount());
    createDeliverySpy = spyOn(NotificationRepository, "createDelivery").mockResolvedValue(mockDelivery);
    updateDeliveryStatusSpy = spyOn(NotificationRepository, "updateDeliveryStatus").mockResolvedValue(mockDelivery);
  });

  afterEach(async () => {
    findFirstActiveForCredentialsSpy.mockRestore();
    createDeliverySpy.mockRestore();
    updateDeliveryStatusSpy.mockRestore();
    await resetWhatsappChannel();
    invalidateEnvConfigCache();
  });

  describe("S4: resetWhatsappChannel — singleton lifecycle", () => {
    test("resetWhatsappChannel drops the singleton instance so next init creates a fresh adapter", async () => {
      // Initialize the singleton by calling validateConfig via the proxy
      await whatsappChannel.validateConfig();
      // Grab the underlying adapter instance created by the factory
      const adapter1 = await getWhatsappChannel();

      await resetWhatsappChannel();

      // After reset, a new call to getWhatsappChannel must create a DIFFERENT
      // adapter object — proving the singleton reference was actually dropped.
      const adapter2 = await getWhatsappChannel();
      expect(adapter2).not.toBe(adapter1);

      expect(createDeliverySpy).not.toHaveBeenCalled();
    });

    test("resetWhatsappChannel is idempotent when no instance exists", async () => {
      const result = await resetWhatsappChannel();
      expect(result).toBeUndefined();
    });
  });

  describe("validateConfig", () => {
    test("returns true when an active WhatsApp account with credentials is present", async () => {
      const result = await whatsappChannel.validateConfig();
      expect(result).toBe(true);
    });

    test("returns false when no active WhatsApp account is configured", async () => {
      findFirstActiveForCredentialsSpy.mockResolvedValue(null);
      await resetWhatsappChannel();
      const result = await whatsappChannel.validateConfig();
      expect(result).toBe(false);
    });

    test("returns false when the active account has a null access token", async () => {
      findFirstActiveForCredentialsSpy.mockResolvedValue(
        mockWhatsappCredentialsAccount({ encryptedAccessToken: null })
      );
      await resetWhatsappChannel();

      const result = await whatsappChannel.validateConfig();
      expect(result).toBe(false);
    });
  });

  describe("send — empty recipient guard", () => {
    test("returns failure when `to` is empty — no delivery row (fail-fast before create)", async () => {
      const result = await whatsappChannel.send({ ...sendParams(), to: "" });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.sendAttempted).toBe(false);
      expect(createDeliverySpy).not.toHaveBeenCalled();
      expect(updateDeliveryStatusSpy).not.toHaveBeenCalled();
    });

    test("returns failure when `to` is whitespace-only", async () => {
      const result = await whatsappChannel.send({ ...sendParams(), to: "   " });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe("send — Graph API paths", () => {
    let setNxSpy: ReturnType<typeof spyOn>;
    let getSpy: ReturnType<typeof spyOn>;
    let setSpy: ReturnType<typeof spyOn>;
    let fetchSpy: ReturnType<typeof spyOn>;

    beforeEach(() => {
      setNxSpy = spyOn(redisService, "setNx").mockResolvedValue("OK");
      getSpy = spyOn(redisService, "get").mockResolvedValue(null);
      setSpy = spyOn(redisService, "set").mockResolvedValue(undefined);
    });

    afterEach(() => {
      setNxSpy.mockRestore();
      getSpy.mockRestore();
      setSpy.mockRestore();
      fetchSpy?.mockRestore();
    });

    async function sendWithMockedFetch(body: Record<string, unknown>, status: number) {
      fetchSpy = mockFetchResponse(body, status);
      return whatsappChannel.send(sendParams());
    }

    test("returns success when fetch responds 200 with a message id", async () => {
      const result = await sendWithMockedFetch(
        { messages: [{ id: "wamid.test.001" }], messaging_product: "whatsapp" },
        200
      );

      expect(result.success).toBe(true);
      expect(result.providerMessageId).toBe("wamid.test.001");
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(updateDeliveryStatusSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: NotificationDeliveryStatus.SENT })
      );
    });

    test("returns failure when fetch responds non-2xx (500)", async () => {
      const result = await sendWithMockedFetch({ error: { message: "Internal server error", code: 500 } }, 500);

      expect(result.success).toBe(false);
      expect(result.sendAttempted).toBe(true);
      expect(result.rateLimited).not.toBe(true);
      expect(updateDeliveryStatusSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: NotificationDeliveryStatus.FAILED })
      );
    });

    test("returns rate-limited result when Meta error code 131056 is received", async () => {
      const result = await sendWithMockedFetch({ error: { message: "Rate limit hit", code: 131056 } }, 429);

      expect(result.success).toBe(false);
      expect(result.sendAttempted).toBe(true);
      expect(result.rateLimited).toBe(true);
      // B2: Meta 131056 must NOT mark delivery as FAILED — caller should deferred-retry
      expect(updateDeliveryStatusSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ status: NotificationDeliveryStatus.FAILED })
      );
    });

    test("returns failure with sendAttempted=false when credentials are missing", async () => {
      fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));

      findFirstActiveForCredentialsSpy.mockResolvedValue(null);
      await resetWhatsappChannel();

      const result = await whatsappChannel.send(sendParams());

      expect(result.success).toBe(false);
      expect(result.sendAttempted).toBe(false);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
});
