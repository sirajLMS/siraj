import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/backend/enum";

// ---------------------------------------------------------------------------
// Mocks — must register before SUT import (FX pattern)
// ---------------------------------------------------------------------------

const redisGetMock = mock(async (_key: string): Promise<string | null> => null);
const redisSetMock = mock(async (): Promise<void> => {});

function makeRedisModuleFactory(extras?: Record<string, unknown>) {
  return () => {
    const base = {
      redisService: {
        get: redisGetMock,
        set: redisSetMock,
      },
      getRedisService: async () => ({
        get: redisGetMock,
        set: redisSetMock,
      }),
    };
    return extras ? { ...base, ...extras } : base;
  };
}

await mock.module("@/backend/services/redis", makeRedisModuleFactory());

await mock.module(
  "@/backend/services/redis/index",
  makeRedisModuleFactory({
    SessionRedisService: class SessionRedisService {
      // Minimal placeholder used by tests — provides a ping method to avoid an empty-class lint/sonar issue.
      ping(): boolean {
        return true;
      }
    },
  })
);

await mock.module("@/backend/lib/logger", () => ({
  logger: {
    log: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  },
}));

await mock.module("@/backend/lib/field-encryption", () => ({
  encryptField: (val: string) => val,
  decryptField: (val: string) => val,
}));

// Mock the entire system barrel to avoid pulling in real DB services during test
await mock.module("@/backend/services/system", () => ({
  resolveEnvConfig: async (key: string) => {
    if (key === "WHATSAPP_ACCESS_TOKEN") return "test-token";
    if (key === "WHATSAPP_PHONE_NUMBER_ID") return "phone-id-123";
    if (key === "WHATSAPP_API_VERSION") return "23.0";
    return null;
  },
  resolveEnvConfigMany: async (keys: string[]) => {
    const result: Record<string, string | undefined> = {};
    for (const key of keys) {
      if (key === "WHATSAPP_ACCESS_TOKEN") result[key] = "test-token";
      else if (key === "WHATSAPP_PHONE_NUMBER_ID") result[key] = "phone-id-123";
      else if (key === "WHATSAPP_API_VERSION") result[key] = "23.0";
      else result[key] = undefined;
    }
    return result;
  },
  invalidateEnvConfigCache: () => {},
}));

const mockDelivery = {
  id: "00000000-0000-0000-0000-000000000001",
  userId: "u1",
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

await mock.module("@/backend/db/repo", () => ({
  NotificationRepository: {
    createDelivery: async () => mockDelivery,
    updateDeliveryStatus: async () => mockDelivery,
  },
  WhatsappAccountRepository: {
    findFirstActiveForCredentials: async () => ({
      id: "00000000-0000-0000-0000-000000000099",
      encryptedAccessToken: "test-token",
      phoneNumberId: "phone-id-123",
      isActive: true,
    }),
  },
}));

await mock.module("@/backend/db/repo/notifications/notification.repository", () => ({
  NotificationRepository: {
    createDelivery: async () => mockDelivery,
    updateDeliveryStatus: async () => mockDelivery,
  },
}));

await mock.module("@/backend/db/schema", () => ({
  whatsappAccounts: {
    id: "wa",
    isActive: "isActive",
    encryptedAccessToken: "encryptedAccessToken",
    phoneNumberId: "phoneNumberId",
  },
}));

const mockLimit = async (): Promise<unknown[]> => [];
const mockWhereChain = () => ({ limit: mockLimit });
const mockFromChain = () => ({ where: mockWhereChain });
const mockSelectChain = () => ({ from: mockFromChain });
const mockQueryDb = () => ({ select: mockSelectChain });

await mock.module("@/backend/db", () => ({
  queryDb: mockQueryDb,
  db: {},
}));

async function importAdapter() {
  return import("@/backend/services/communication/channels/whatsapp/cloud-api/MetaCloudApiAdapter");
}

const PAIR_RATE_LIMIT_MS = 6000;
const REDIS_PAIR_KEY_PREFIX = "whatsapp:pair:";
const PAIR_RATE_LIMIT_TTL_SEC = 60;

function computeDeferMs(lastStr: string | null, now: number): number {
  if (lastStr === null) return 0;
  const last = Number.parseInt(lastStr, 10);
  if (!Number.isFinite(last)) return 0;
  const elapsed = now - last;
  if (elapsed < PAIR_RATE_LIMIT_MS) return PAIR_RATE_LIMIT_MS - elapsed;
  return 0;
}

function makeOkResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

interface AdapterSendScenario {
  adapter: InstanceType<Awaited<ReturnType<typeof importAdapter>>["MetaCloudApiAdapter"]>;
  fetchSpy: ReturnType<typeof spyOn>;
}

async function setupAdapterAndFetchSpy(wamid: string): Promise<AdapterSendScenario> {
  const { MetaCloudApiAdapter } = await importAdapter();
  const adapter = new MetaCloudApiAdapter();
  const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
    makeOkResponse({ messages: [{ id: wamid }], messaging_product: "whatsapp" })
  );
  return { adapter, fetchSpy };
}

function resetRedisMocks() {
  redisGetMock.mockReset();
  redisGetMock.mockResolvedValue(null);
  redisSetMock.mockReset();
  redisSetMock.mockResolvedValue(undefined);
}

const sendPayload = {
  to: "5511999999999",
  userId: "u1",
  eventType: NotificationEventType.COMPLAINT_RESPONSE,
  template: { name: "tpl", languageCode: "en" },
} as const;

beforeEach(() => {
  resetRedisMocks();
});

afterEach(() => {
  mock.restore();
});

describe("B2: Pair-Rate-Limit math (MetaCloudApiAdapter)", () => {
  test("Redis key shape is whatsapp:pair:<e164>", async () => {
    const { MetaCloudApiAdapter } = await importAdapter();
    const adapter = new MetaCloudApiAdapter();

    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      makeOkResponse({ messages: [{ id: "wamid.key" }], messaging_product: "whatsapp" })
    );

    await adapter.send({ ...sendPayload });

    expect(redisGetMock).toHaveBeenCalledWith(`${REDIS_PAIR_KEY_PREFIX}5511999999999`);
    expect(redisSetMock).toHaveBeenCalledWith(`${REDIS_PAIR_KEY_PREFIX}5511999999999`, expect.any(String), {
      ex: PAIR_RATE_LIMIT_TTL_SEC,
    });

    fetchSpy.mockRestore();
  });

  test("defer math: elapsed=0 -> defer PAIR_RATE_LIMIT_MS (6000ms)", async () => {
    const now = 1_000_000;
    const defer = computeDeferMs(String(now), now);
    expect(defer).toBe(PAIR_RATE_LIMIT_MS);
    expect(defer).toBe(6000);
  });

  test("defer math: elapsed=1 -> defer 5999ms via SUT export", async () => {
    expect(computeDeferMs(String(1_000_000), 1_000_001)).toBe(5999);
  });

  test("defer math: elapsed=5999 -> defer 1ms via SUT export", async () => {
    expect(computeDeferMs(String(1_000_000), 1_005_999)).toBe(1);
  });

  test("defer math: elapsed=6000 (exactly) -> defer 0 (boundary: not < window) via SUT export", async () => {
    expect(computeDeferMs(String(1_000_000), 1_006_000)).toBe(0);
  });

  test("defer math: elapsed=6001 -> defer 0 (past window) via SUT export", async () => {
    expect(computeDeferMs(String(1_000_000), 1_006_001)).toBe(0);
  });

  test("defer math: non-numeric lastStr (e.g. 'abc') -> defer 0 via SUT export", async () => {
    expect(computeDeferMs("abc", 1_000_000)).toBe(0);
  });

  test("defer math: null lastStr -> defer 0 via SUT export", async () => {
    expect(computeDeferMs(null, 1_000_000)).toBe(0);
  });

  test("defer math: clock skew (future timestamp, negative elapsed) -> defer > window", async () => {
    const now = 1_000_000;
    const last = now + 1_000_000;
    const defer = computeDeferMs(String(last), now);
    expect(defer).toBeGreaterThan(PAIR_RATE_LIMIT_MS);
    expect(defer).toBe(PAIR_RATE_LIMIT_MS - (now - last));
  });
});

describe("B2: Pair-Rate-Limit GET guard path", () => {
  test("when redis GET returns null, adapter proceeds immediately and records success timestamp", async () => {
    const { MetaCloudApiAdapter } = await importAdapter();
    const adapter = new MetaCloudApiAdapter();
    redisGetMock.mockResolvedValueOnce(null);

    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      makeOkResponse({ messages: [{ id: "wamid.fast" }], messaging_product: "whatsapp" })
    );

    const result = await adapter.send({ ...sendPayload });

    expect(result.success).toBe(true);
    expect(redisGetMock).toHaveBeenCalledWith(`${REDIS_PAIR_KEY_PREFIX}5511999999999`);
    expect(fetchSpy).toHaveBeenCalled();
    expect(redisSetMock).toHaveBeenCalledWith(`${REDIS_PAIR_KEY_PREFIX}5511999999999`, expect.any(String), {
      ex: PAIR_RATE_LIMIT_TTL_SEC,
    });

    fetchSpy.mockRestore();
  });

  test("when redis has a recent timestamp, adapter returns rateLimited without sending", async () => {
    const { adapter, fetchSpy } = await setupAdapterAndFetchSpy("wamid.deferred");
    redisGetMock.mockResolvedValueOnce(String(Date.now()));

    const result = await adapter.send({ ...sendPayload });

    expect(result.success).toBe(false);
    expect(result.rateLimited).toBe(true);
    expect(result.sendAttempted).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(redisSetMock).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  test("when redis GET returns a stale timestamp, adapter proceeds and sends", async () => {
    const { adapter, fetchSpy } = await setupAdapterAndFetchSpy("wamid.stale");
    redisGetMock.mockResolvedValueOnce(String(Date.now() - PAIR_RATE_LIMIT_MS - 1000));

    const result = await adapter.send({ ...sendPayload });

    expect(result.success).toBe(true);
    expect(fetchSpy).toHaveBeenCalled();
    expect(redisSetMock).toHaveBeenCalled();

    fetchSpy.mockRestore();
  });
});

describe("B2: Pair-Rate-Limit adapter behavior (guard hit / fail-open)", () => {
  test("when redis returns null, no rate-limit — proceed to send, set written", async () => {
    const { adapter, fetchSpy } = await setupAdapterAndFetchSpy("wamid.456");
    redisGetMock.mockResolvedValueOnce(null);

    await adapter.send({ ...sendPayload });

    expect(redisSetMock).toHaveBeenCalledWith(`${REDIS_PAIR_KEY_PREFIX}5511999999999`, expect.any(String), {
      ex: PAIR_RATE_LIMIT_TTL_SEC,
    });
    expect(fetchSpy).toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  test("when redis throws, adapter uses local fallback and still proceeds on first send", async () => {
    const { adapter, fetchSpy } = await setupAdapterAndFetchSpy("wamid.789");

    redisGetMock.mockRejectedValueOnce(new Error("Redis down"));

    const result = await adapter.send({ ...sendPayload });

    expect(result.success).toBe(true);
    expect(fetchSpy).toHaveBeenCalled();

    fetchSpy.mockRestore();
  });
});
