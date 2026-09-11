import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { NotificationRepository } from "@/backend/db/repo/notifications";
import { WhatsappAccountRepository } from "@/backend/db/repo/whatsapp";
import { NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/backend/enum";
import {
  WhatsappAccountPurpose,
  WhatsappOnboardingMode,
  WhatsappSyncStatus,
} from "@/backend/enum/whatsapp/whatsapp-account.enum";
import { WHATSAPP_ACCOUNT_OFFBOARDED_CODE } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import {
  getChannelForPurpose,
  getWhatsappChannel,
  resetWhatsappChannel,
  validateWhatsappChannelConfig,
  whatsappChannel,
} from "@/backend/services/communication/channels/whatsapp/WhatsappChannelFactory";
import { redisService } from "@/backend/services/redis";
import { invalidateEnvConfigCache, resolveEnvConfig } from "@/backend/services/system";
import type { NotificationDeliverySelectType, WhatsappAccountSelectType } from "@/backend/types";

const MOCK_USER_ID = "user-uuid-wa-0001";
const MOCK_DELIVERY_ID = "delivery-uuid-wa-0001";
const ACCOUNT_A_ID = "aaaaaaaa-0000-0000-0000-00000000000a";
const ACCOUNT_B_ID = "bbbbbbbb-0000-0000-0000-00000000000b";
const ACCOUNT_C_ID = "cccccccc-0000-0000-0000-00000000000c";
const MISSING_ACCOUNT_ID = "dddddddd-0000-0000-0000-00000000000d";

// Digit-only fake numbers (request builder requires numeric recipients).
const RECIPIENT_E164 = "15555500001";
const DISPLAY_A = "15555550101";
const DISPLAY_B = "15555550102";
const PAIR_PREFIX = "whatsapp:pair:";

function sendParams(senderAccountId?: string) {
  return {
    to: RECIPIENT_E164,
    eventType: NotificationEventType.COMPLAINT_RESPONSE,
    userId: MOCK_USER_ID,
    template: { name: "test_template", languageCode: "en" },
    senderAccountId,
  };
}
function mockWhatsappCredentialsAccount(overrides: Partial<WhatsappAccountSelectType> = {}): WhatsappAccountSelectType {
  return {
    id: ACCOUNT_A_ID,
    wabaId: "waba-0001",
    phoneNumberId: "phone-id-a",
    displayName: { en: "Account A" },
    displayPhoneNumber: DISPLAY_A,
    qualityRating: null,
    portfolioMessagingLimitTier: null,
    throughputLevel: null,
    maxPhoneNumbersPerBusiness: null,
    encryptedAccessToken: "tok_test_a",
    encryptedTwoStepPin: "pin-000",
    purpose: WhatsappAccountPurpose.GENERAL,
    onboardingMode: WhatsappOnboardingMode.CLOUD_API,
    syncStatus: WhatsappSyncStatus.NOT_STARTED,
    syncPhase: null,
    syncProgress: 0,
    syncDeadlineAt: null,
    syncFailureReason: null,
    offboardedAt: null,
    isActive: true,
    isTestNumber: false,
    metaStatus: null,
    lastWebhookAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
const accountB = mockWhatsappCredentialsAccount({
  id: ACCOUNT_B_ID,
  phoneNumberId: "phone-id-b",
  displayPhoneNumber: DISPLAY_B,
  encryptedAccessToken: "tok_test_b",
  purpose: WhatsappAccountPurpose.STUDENTS,
});

let accountsById: Map<string, WhatsappAccountSelectType>;

function mockFetchResponse(body: Record<string, unknown>, status: number) {
  // A Response body can be consumed only once — resolve a fresh Response per
  // fetch call so consecutive sends do not fail on "body already used".
  const impl = async () => new Response(JSON.stringify(body), { status });
  const fetchFn = Object.assign(impl, { preconnect: () => undefined });
  return spyOn(globalThis, "fetch").mockImplementation(fetchFn);
}

function okSendResponse(wamid: string) {
  return mockFetchResponse({ messages: [{ id: wamid }], messaging_product: "whatsapp" }, 200);
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
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function fetchUrlAt(fetchSpy: ReturnType<typeof spyOn>, callIndex: number): string {
  const call: unknown = fetchSpy.mock.calls[callIndex];
  const input = Array.isArray(call) ? call[0] : undefined;
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  if (input instanceof Request) return input.url;
  return "";
}

function bearerOf(fetchSpy: ReturnType<typeof spyOn>, callIndex: number): string {
  const call: unknown = fetchSpy.mock.calls[callIndex];
  const init = Array.isArray(call) ? call[1] : undefined;
  if (!isRecord(init) || !isRecord(init.headers)) return "";
  const auth = init.headers.Authorization;
  return typeof auth === "string" ? auth : "";
}

describe("WhatsApp Channel Factory (per-account)", () => {
  const accountA = mockWhatsappCredentialsAccount();
  let createDeliverySpy: ReturnType<typeof spyOn>;
  let updateDeliveryStatusSpy: ReturnType<typeof spyOn>;
  let findCredentialsByIdSpy: ReturnType<typeof spyOn>;
  let findActiveGeneralSpy: ReturnType<typeof spyOn>;
  let findActiveByPurposeSpy: ReturnType<typeof spyOn>;

  beforeEach(async () => {
    await resetWhatsappChannel();
    invalidateEnvConfigCache();
    accountsById = new Map<string, WhatsappAccountSelectType>([
      [ACCOUNT_A_ID, accountA],
      [ACCOUNT_B_ID, accountB],
    ]);
    findCredentialsByIdSpy = spyOn(WhatsappAccountRepository, "findCredentialsById").mockImplementation(
      async (id: string) => accountsById.get(id) ?? null
    );
    findActiveGeneralSpy = spyOn(WhatsappAccountRepository, "findActiveGeneral").mockResolvedValue(accountA);
    findActiveByPurposeSpy = spyOn(WhatsappAccountRepository, "findActiveByPurpose").mockImplementation(
      async (purpose: WhatsappAccountPurpose) => (purpose === WhatsappAccountPurpose.STUDENTS ? accountB : accountA)
    );
    spyOn(redisService, "get").mockResolvedValue(null);
    spyOn(redisService, "set").mockResolvedValue(undefined);
    createDeliverySpy = spyOn(NotificationRepository, "createDelivery").mockResolvedValue(mockDelivery);
    updateDeliveryStatusSpy = spyOn(NotificationRepository, "updateDeliveryStatus").mockResolvedValue(mockDelivery);
  });
  afterEach(async () => {
    spyOn(globalThis, "fetch").mockRestore();
    createDeliverySpy.mockRestore();
    updateDeliveryStatusSpy.mockRestore();
    findCredentialsByIdSpy.mockRestore();
    findActiveGeneralSpy.mockRestore();
    findActiveByPurposeSpy.mockRestore();
    await resetWhatsappChannel();
    invalidateEnvConfigCache();
  });

  describe("per-account instance map", () => {
    test("getWhatsappChannel caches one instance per accountId", async () => {
      const first = await getWhatsappChannel(ACCOUNT_A_ID);
      const again = await getWhatsappChannel(ACCOUNT_A_ID);
      const other = await getWhatsappChannel(ACCOUNT_B_ID);

      expect(first).toBe(again);
      expect(other).not.toBe(first);
    });

    test("resetWhatsappChannel(accountId) evicts only that account's instance", async () => {
      const a1 = await getWhatsappChannel(ACCOUNT_A_ID);
      const b1 = await getWhatsappChannel(ACCOUNT_B_ID);

      await resetWhatsappChannel(ACCOUNT_A_ID);

      const a2 = await getWhatsappChannel(ACCOUNT_A_ID);
      const b2 = await getWhatsappChannel(ACCOUNT_B_ID);
      expect(a2).not.toBe(a1);
      expect(b2).toBe(b1);
    });
    test("resetWhatsappChannel() without arguments drops all instances", async () => {
      const a1 = await getWhatsappChannel(ACCOUNT_A_ID);
      const b1 = await getWhatsappChannel(ACCOUNT_B_ID);

      await resetWhatsappChannel();

      expect(await getWhatsappChannel(ACCOUNT_A_ID)).not.toBe(a1);
      expect(await getWhatsappChannel(ACCOUNT_B_ID)).not.toBe(b1);
    });

    test("resetWhatsappChannel is idempotent when nothing is cached", async () => {
      const result = await resetWhatsappChannel();
      expect(result).toBeUndefined();
    });

    test("rejects an empty accountId", async () => {
      let caught: unknown = null;
      try {
        await getWhatsappChannel(" ");
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(Error);
    });
  });
  describe("getChannelForPurpose resolution", () => {
    test("resolves the purpose-specific account", async () => {
      const resolved = await getChannelForPurpose(WhatsappAccountPurpose.STUDENTS);
      expect(resolved?.accountId).toBe(ACCOUNT_B_ID);
    });

    test("falls back to the GENERAL account when the purpose has no account", async () => {
      findActiveByPurposeSpy.mockImplementation(async (purpose: WhatsappAccountPurpose) =>
        purpose === WhatsappAccountPurpose.GENERAL ? accountA : null
      );
      const resolved = await getChannelForPurpose(WhatsappAccountPurpose.STUDENTS);
      expect(resolved?.accountId).toBe(ACCOUNT_A_ID);
    });

    test("returns null when no account qualifies (GENERAL has no fallback)", async () => {
      findActiveByPurposeSpy.mockResolvedValue(null);
      findActiveGeneralSpy.mockResolvedValue(null);
      const resolved = await getChannelForPurpose(WhatsappAccountPurpose.GENERAL);
      expect(resolved).toBeNull();
    });

    test("logs a warn when routing falls back to the GENERAL account", async () => {
      const warnSpy = spyOn(logger, "warn");
      findActiveByPurposeSpy.mockImplementation(async (purpose: WhatsappAccountPurpose) =>
        purpose === WhatsappAccountPurpose.GENERAL ? accountA : null
      );
      const resolved = await getChannelForPurpose(WhatsappAccountPurpose.STUDENTS);

      expect(resolved?.accountId).toBe(ACCOUNT_A_ID);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    test("does not warn when the purpose account resolves directly", async () => {
      const warnSpy = spyOn(logger, "warn");
      const resolved = await getChannelForPurpose(WhatsappAccountPurpose.STUDENTS);

      expect(resolved?.accountId).toBe(ACCOUNT_B_ID);
      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });
  describe("per-account credential isolation", () => {
    test("sends from each account carry that account's bearer token", async () => {
      const fetchSpy = okSendResponse("wamid-iso-001");

      const fromA = await whatsappChannel.send(sendParams(ACCOUNT_A_ID));
      const fromB = await whatsappChannel.send(sendParams(ACCOUNT_B_ID));

      expect(fromA.success).toBe(true);
      expect(fromB.success).toBe(true);
      expect(bearerOf(fetchSpy, 0)).toBe("Bearer tok_test_a");
      expect(bearerOf(fetchSpy, 1)).toBe("Bearer tok_test_b");
    });

    test("pair-rate-limit keys are namespaced by sender account", async () => {
      const redisSetSpy = spyOn(redisService, "set");
      okSendResponse("wamid-pair-001");

      const fromA = await whatsappChannel.send(sendParams(ACCOUNT_A_ID));
      expect(fromA.success).toBe(true);
      expect(redisSetSpy).toHaveBeenCalledWith(`${PAIR_PREFIX}${DISPLAY_A}:${RECIPIENT_E164}`, expect.any(String), {
        ex: 60,
      });

      redisSetSpy.mockClear();
      const fromB = await whatsappChannel.send(sendParams(ACCOUNT_B_ID));
      expect(fromB.success).toBe(true);
      expect(redisSetSpy).toHaveBeenCalledWith(`${PAIR_PREFIX}${DISPLAY_B}:${RECIPIENT_E164}`, expect.any(String), {
        ex: 60,
      });
      redisSetSpy.mockRestore();
    });
    test("sender key falls back to phoneNumberId when no display number is synced", async () => {
      accountsById.set(
        ACCOUNT_C_ID,
        mockWhatsappCredentialsAccount({
          id: ACCOUNT_C_ID,
          phoneNumberId: "phone-id-c",
          displayPhoneNumber: null,
          encryptedAccessToken: "tok_test_c",
        })
      );
      const redisSetSpy = spyOn(redisService, "set");
      okSendResponse("wamid-pair-002");

      const result = await whatsappChannel.send(sendParams(ACCOUNT_C_ID));
      expect(result.success).toBe(true);
      expect(redisSetSpy).toHaveBeenCalledWith(`${PAIR_PREFIX}phone-id-c:${RECIPIENT_E164}`, expect.any(String), {
        ex: 60,
      });

      redisSetSpy.mockRestore();
    });

    test("legacy sends without senderAccountId resolve the default GENERAL account", async () => {
      const fetchSpy = okSendResponse("wamid-default-001");

      const result = await whatsappChannel.send(sendParams());

      expect(result.success).toBe(true);
      expect(findActiveGeneralSpy).toHaveBeenCalled();
      expect(bearerOf(fetchSpy, 0)).toBe("Bearer tok_test_a");
    });
    test("legacy sends fail without any GENERAL account (no first-active fallback)", async () => {
      findActiveGeneralSpy.mockResolvedValue(null);
      const fetchSpy = okSendResponse("wamid-unused-001");

      const result = await whatsappChannel.send(sendParams());

      expect(result.success).toBe(false);
      expect(result.sendAttempted).toBe(false);
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(createDeliverySpy).not.toHaveBeenCalled();
    });

    test("a rotated token on the repo is picked up after reset (cache isolation)", async () => {
      const fetchSpy = okSendResponse("wamid-rotate-001");

      const before = await whatsappChannel.send(sendParams(ACCOUNT_A_ID));
      expect(before.success).toBe(true);
      expect(bearerOf(fetchSpy, 0)).toBe("Bearer tok_test_a");

      accountsById.set(ACCOUNT_A_ID, { ...accountA, encryptedAccessToken: "tok_test_a_rotated" });
      await resetWhatsappChannel(ACCOUNT_A_ID);

      const after = await whatsappChannel.send(sendParams(ACCOUNT_A_ID));
      expect(after.success).toBe(true);
      expect(bearerOf(fetchSpy, 1)).toBe("Bearer tok_test_a_rotated");
    });
  });
  describe("graph api version resolution", () => {
    afterEach(() => {
      delete process.env.WHATSAPP_GRAPH_API_VERSION;
      delete process.env.WHATSAPP_API_VERSION;
      delete process.env.WHATSAPP_WEBHOOK_BASE_URL;
      invalidateEnvConfigCache();
    });

    test("defaults to v25.0 when no env-config key resolves", async () => {
      delete process.env.WHATSAPP_GRAPH_API_VERSION;
      delete process.env.WHATSAPP_API_VERSION;
      invalidateEnvConfigCache();
      const fetchSpy = okSendResponse("wamid-ver-001");

      const result = await whatsappChannel.send(sendParams(ACCOUNT_A_ID));

      expect(result.success).toBe(true);
      expect(fetchUrlAt(fetchSpy, 0)).toContain("/v25.0/phone-id-a/messages");
    });

    test("honours the WHATSAPP_GRAPH_API_VERSION env-config override", async () => {
      process.env.WHATSAPP_GRAPH_API_VERSION = "v99.0";
      invalidateEnvConfigCache();
      const fetchSpy = okSendResponse("wamid-ver-002");

      const result = await whatsappChannel.send(sendParams(ACCOUNT_A_ID));

      expect(result.success).toBe(true);
      expect(fetchUrlAt(fetchSpy, 0)).toContain("/v99.0/phone-id-a/messages");
    });

    test("resetWhatsappChannel re-resolves an edited WHATSAPP_WEBHOOK_BASE_URL", async () => {
      process.env.WHATSAPP_WEBHOOK_BASE_URL = "https://w1.fake.invalid";
      invalidateEnvConfigCache();
      expect(await resolveEnvConfig("WHATSAPP_WEBHOOK_BASE_URL")).toBe("https://w1.fake.invalid");

      process.env.WHATSAPP_WEBHOOK_BASE_URL = "https://w2.fake.invalid";
      await resetWhatsappChannel(ACCOUNT_A_ID);

      expect(await resolveEnvConfig("WHATSAPP_WEBHOOK_BASE_URL")).toBe("https://w2.fake.invalid");
    });
  });
  describe("offboarded accounts fail fast", () => {
    test("send to an offboarded account returns the domain code without any Graph call", async () => {
      accountsById.set(ACCOUNT_A_ID, { ...accountA, offboardedAt: new Date() });
      const fetchSpy = okSendResponse("wamid-offboard-001");

      const result = await whatsappChannel.send(sendParams(ACCOUNT_A_ID));

      expect(result.success).toBe(false);
      expect(result.sendAttempted).toBe(false);
      expect(result.errorCode).toBe(WHATSAPP_ACCOUNT_OFFBOARDED_CODE);
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(createDeliverySpy).not.toHaveBeenCalled();
    });

    test("eviction via resetWhatsappChannel(accountId) clears cached credentials", async () => {
      okSendResponse("wamid-evict-001");
      const first = await whatsappChannel.send(sendParams(ACCOUNT_A_ID));
      expect(first.success).toBe(true);

      accountsById.set(ACCOUNT_A_ID, { ...accountA, offboardedAt: new Date() });
      await resetWhatsappChannel(ACCOUNT_A_ID);

      const second = await whatsappChannel.send(sendParams(ACCOUNT_A_ID));
      expect(second.success).toBe(false);
      expect(second.errorCode).toBe(WHATSAPP_ACCOUNT_OFFBOARDED_CODE);
    });

    test("missing account fails before any Graph call", async () => {
      const fetchSpy = okSendResponse("wamid-missing-001");

      const result = await whatsappChannel.send(sendParams(MISSING_ACCOUNT_ID));

      expect(result.success).toBe(false);
      expect(result.sendAttempted).toBe(false);
      expect(result.errorCode).toBeUndefined();
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
  describe("validateConfig / health hooks", () => {
    test("validateWhatsappChannelConfig resolves credentials for one account", async () => {
      expect(await validateWhatsappChannelConfig(ACCOUNT_A_ID)).toBe(true);
    });

    test("validateWhatsappChannelConfig is false for a missing account", async () => {
      expect(await validateWhatsappChannelConfig(MISSING_ACCOUNT_ID)).toBe(false);
    });

    test("proxy validateConfig is true when the default account resolves", async () => {
      expect(await whatsappChannel.validateConfig()).toBe(true);
    });

    test("proxy validateConfig is false when no GENERAL account exists", async () => {
      findActiveGeneralSpy.mockResolvedValue(null);
      expect(await whatsappChannel.validateConfig()).toBe(false);
    });

    test("proxy validateConfig is false when the default account has a null token", async () => {
      accountsById.set(ACCOUNT_A_ID, { ...accountA, encryptedAccessToken: null });
      expect(await whatsappChannel.validateConfig()).toBe(false);
    });
  });
  describe("send — guards and Graph API paths", () => {
    test("empty recipient fails fast without a delivery row", async () => {
      const result = await whatsappChannel.send({ ...sendParams(ACCOUNT_A_ID), to: "  " });

      expect(result.success).toBe(false);
      expect(result.sendAttempted).toBe(false);
      expect(createDeliverySpy).not.toHaveBeenCalled();
    });

    test("500 response marks the delivery FAILED", async () => {
      mockFetchResponse({ error: { message: "Internal server error", code: 500 } }, 500);

      const result = await whatsappChannel.send(sendParams(ACCOUNT_A_ID));

      expect(result.success).toBe(false);
      expect(result.sendAttempted).toBe(true);
      expect(updateDeliveryStatusSpy).toHaveBeenCalledWith(
        expect.objectContaining({ status: NotificationDeliveryStatus.FAILED })
      );
    });

    test("Meta error 131056 returns rateLimited without marking FAILED", async () => {
      mockFetchResponse({ error: { message: "Rate limit hit", code: 131056 } }, 429);

      const result = await whatsappChannel.send(sendParams(ACCOUNT_A_ID));

      expect(result.success).toBe(false);
      expect(result.rateLimited).toBe(true);
      expect(updateDeliveryStatusSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ status: NotificationDeliveryStatus.FAILED })
      );
    });
    test("401 invalidates per-account credential cache and retries once", async () => {
      const fetchSpy = spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ error: { message: "Invalid OAuth access token" } }), { status: 401 })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ messages: [{ id: "wamid-retry-001" }], messaging_product: "whatsapp" }), {
            status: 200,
          })
        );

      const result = await whatsappChannel.send(sendParams(ACCOUNT_A_ID));

      expect(result.success).toBe(true);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    test("second consecutive 401 does not retry again", async () => {
      const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
        new Response(JSON.stringify({ error: { message: "Invalid OAuth access token" } }), { status: 401 })
      );

      const result = await whatsappChannel.send(sendParams(ACCOUNT_A_ID));

      expect(result.success).toBe(false);
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });
});
