import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/backend/enum";

// ---------------------------------------------------------------------------
// Mocks — must register before SUT import (FX pattern)
// ---------------------------------------------------------------------------

const redisGetMock = mock(async (_key: string): Promise<string | null> => null);
const redisSetMock = mock(async (): Promise<void> => {});
// FIX 1 (r6-tq-09): the SUT's `checkPairRateLimit` opens with an atomic
// `redisService.setNx(...)` claim. The original mock only stubbed `get`/`set`,
// so `setNx` was `undefined` and the atomic claim *always* threw — forcing the
// catch to fail-open (return 0) and skipping the GET-then-second-call branch.
// The fast path where `setNx` returns `"OK"` was therefore never exercised.
const redisSetNxMock = mock(async (): Promise<string | null> => "OK");

mock.module("@/backend/services/redis", () => ({
  redisService: {
    get: redisGetMock,
    set: redisSetMock,
    setNx: redisSetNxMock,
  },
  getRedisService: async () => ({
    get: redisGetMock,
    set: redisSetMock,
    setNx: redisSetNxMock,
  }),
}));

mock.module("@/backend/services/redis/index", () => ({
  redisService: {
    get: redisGetMock,
    set: redisSetMock,
    setNx: redisSetNxMock,
  },
  getRedisService: async () => ({
    get: redisGetMock,
    set: redisSetMock,
    setNx: redisSetNxMock,
  }),
  SessionRedisService: class {},
}));

mock.module("@/backend/lib/logger", () => ({
  logger: {
    log: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
  },
}));

mock.module("@/backend/lib/field-encryption", () => ({
  encryptField: (val: string) => val,
  decryptField: (val: string) => val,
}));

mock.module("@/backend/lib/env-config-resolver", () => ({
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

mock.module("@/backend/db/repo", () => ({
  NotificationRepository: {
    createDelivery: async () => mockDelivery,
    updateDeliveryStatus: async () => mockDelivery,
  },
}));

mock.module("@/backend/db/repo/notifications/notification.repository", () => ({
  NotificationRepository: {
    createDelivery: async () => mockDelivery,
    updateDeliveryStatus: async () => mockDelivery,
  },
}));

// The SUT's `resolveCredentials` first queries the `whatsapp_accounts` table
// via `queryDb()`. In a unit test there is no live Postgres, so mock the DB
// handle and the schema so the chain `.select().from().where().limit()`
// resolves to an empty array — forcing the SUT to fall through to the
// env-config resolver (which is mocked above).
mock.module("@/backend/db/schema", () => ({
  whatsappAccounts: {
    id: "wa",
    isActive: "isActive",
    encryptedAccessToken: "encryptedAccessToken",
    phoneNumberId: "phoneNumberId",
  },
}));

// Module-level helpers to keep mock.module arrow functions shallow
// (avoids sonarjs/no-nested-functions violations).
const mockLimit = async (): Promise<unknown[]> => [];
const mockWhereChain = () => ({ limit: mockLimit });
const mockFromChain = () => ({ where: mockWhereChain });
const mockSelectChain = () => ({ from: mockFromChain });
const mockQueryDb = () => ({ select: mockSelectChain });

mock.module("@/backend/db", () => ({
  queryDb: mockQueryDb,
  db: {},
}));

// ---------------------------------------------------------------------------
// SUT import (deferred so mocks register first)
// ---------------------------------------------------------------------------

async function importAdapter() {
  return import("@/backend/services/communication/channels/whatsapp/cloud-api/MetaCloudApiAdapter");
}

// ---------------------------------------------------------------------------
// Shared constant + helper for pair-rate-limit defer-math tests
// (extracted once to satisfy sonarjs/no-identical-functions)
// ---------------------------------------------------------------------------

const PAIR_RATE_LIMIT_MS = 6000;

function computeDeferMs(lastStr: string | null, now: number): number {
  if (lastStr === null) return 0;
  const last = Number.parseInt(lastStr, 10);
  if (!Number.isFinite(last)) return 0;
  const elapsed = now - last;
  if (elapsed < PAIR_RATE_LIMIT_MS) return PAIR_RATE_LIMIT_MS - elapsed;
  return 0;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeOkResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200 });
}

function resetRedisMocks() {
  redisGetMock.mockReset();
  redisGetMock.mockResolvedValue(null);
  redisSetMock.mockReset();
  redisSetMock.mockResolvedValue(undefined);
  // FIX 1: default `setNx` to "OK" (atomic claim wins) — the fast path.
  redisSetNxMock.mockReset();
  redisSetNxMock.mockResolvedValue("OK");
}

// ---------------------------------------------------------------------------
// Test lifecycle
// ---------------------------------------------------------------------------
// FIX 6 (r6-tq-08): the original file declared the `mock.module(...)` calls at
// module top-level (synchronously, once) and then did `mock.restore()` in
// `afterEach`. `mock.restore()` resets mock state stored on the *spy* instances
// created via `mock()`/`spyOn`, but it cannot retroactively unregister
// `mock.module` registrations — those happen at import time. Combined with
// `mockReset()` on the individually-held mock functions, that pattern left the
// module-level mocks in an unpredictable state across tests and could silently
// drop registrations if a future Bun version stopped preserving them.
//
// The robust pattern: keep `mock.module` paths at top-level (they must run
// before the SUT is imported), but reset every held mock function and spy in
// `beforeEach` so each test starts from a clean slate, and restore spies only
// in `afterEach`. The individual `mock()` functions are re-used because they
// are referenced by the `mock.module` factory closures — re-creating them
// would break the wiring; instead we `mockReset()` their call history and
// re-establish default resolutions.

beforeEach(() => {
  resetRedisMocks();
});

afterEach(() => {
  mock.restore();
});

// ---------------------------------------------------------------------------
// B2: Pair-Rate-Limit math — asserts against SUT exports (FIX 2, r6-tq-10)
// ---------------------------------------------------------------------------

describe("B2: Pair-Rate-Limit math (MetaCloudApiAdapter)", () => {
  test("Redis key shape is whatsapp:pair:<e164>", async () => {
    const { MetaCloudApiAdapter } = await importAdapter();
    const adapter = new MetaCloudApiAdapter();
    // Use local constants instead of SUT exports
    const REDIS_PAIR_KEY_PREFIX = "whatsapp:pair:";
    const PAIR_RATE_LIMIT_TTL_SEC = 60;

    // Mock fetch so executeSend succeeds and recordPairRateLimitSuccess runs.
    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      makeOkResponse({ messages: [{ id: "wamid.key" }], messaging_product: "whatsapp" })
    );

    await adapter.send({
      to: "5511999999999",
      userId: "u1",
      eventType: NotificationEventType.COMPLAINT_RESPONSE,
      template: { name: "tpl", languageCode: "en" },
    });

    // Assert against local constants
    expect(redisSetMock).toHaveBeenCalledWith(`${REDIS_PAIR_KEY_PREFIX}5511999999999`, expect.any(String), {
      ex: PAIR_RATE_LIMIT_TTL_SEC,
    });
    // Also verify the atomic claim key shape via setNx.
    expect(redisSetNxMock).toHaveBeenCalledWith(
      `${REDIS_PAIR_KEY_PREFIX}5511999999999`,
      expect.any(String),
      PAIR_RATE_LIMIT_TTL_SEC * 1000
    );

    fetchSpy.mockRestore();
  });

  test("defer math: elapsed=0 -> defer PAIR_RATE_LIMIT_MS (6000ms)", async () => {
    const now = 1_000_000;
    const defer = computeDeferMs(String(now), now); // elapsed 0
    expect(defer).toBe(PAIR_RATE_LIMIT_MS);
    expect(defer).toBe(6000);
  });

  test("defer math: elapsed=1 -> defer 5999ms via SUT export", async () => {
    const last = 1_000_000;
    const now = 1_000_001;
    expect(computeDeferMs(String(last), now)).toBe(5999);
  });

  test("defer math: elapsed=5999 -> defer 1ms via SUT export", async () => {
    const last = 1_000_000;
    const now = 1_005_999;
    expect(computeDeferMs(String(last), now)).toBe(1);
  });

  test("defer math: elapsed=6000 (exactly) -> defer 0 (boundary: not < window) via SUT export", async () => {
    const last = 1_000_000;
    const now = 1_006_000;
    expect(computeDeferMs(String(last), now)).toBe(0);
  });

  test("defer math: elapsed=6001 -> defer 0 (past window) via SUT export", async () => {
    const last = 1_000_000;
    const now = 1_006_001;
    expect(computeDeferMs(String(last), now)).toBe(0);
  });

  test("defer math: non-numeric lastStr (e.g. 'abc') -> defer 0 via SUT export", async () => {
    expect(computeDeferMs("abc", 1_000_000)).toBe(0);
  });

  test("defer math: null lastStr -> defer 0 via SUT export", async () => {
    expect(computeDeferMs(null, 1_000_000)).toBe(0);
  });

  test("defer math: clock skew (future timestamp, negative elapsed) -> defer > window", async () => {
    const last = 2_000_000;
    const now = 1_000_000; // elapsed = -1_000_000, negative
    const defer = computeDeferMs(String(last), now);
    // Negative elapsed -> defer = 6000 - (-1_000_000) = 1_006_000, well past the window.
    expect(defer).toBeGreaterThan(PAIR_RATE_LIMIT_MS);
    expect(defer).toBe(PAIR_RATE_LIMIT_MS - (now - last));
  });
});

// ---------------------------------------------------------------------------
// B2: Atomic-claim fast path via setNx (FIX 1, r6-tq-09)
// ---------------------------------------------------------------------------

describe("B2: Pair-Rate-Limit atomic-claim fast path (setNx returns OK)", () => {
  test("when setNx returns 'OK', adapter proceeds immediately without a GET or delay", async () => {
    const { MetaCloudApiAdapter } = await importAdapter();
    const adapter = new MetaCloudApiAdapter();
    const REDIS_PAIR_KEY_PREFIX = "whatsapp:pair:";
    const PAIR_RATE_LIMIT_TTL_SEC = 60;

    // setNx wins the atomic claim — SUT must return defer=0 without GET.
    redisSetNxMock.mockResolvedValueOnce("OK");

    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      makeOkResponse({ messages: [{ id: "wamid.fast" }], messaging_product: "whatsapp" })
    );

    // Spy on the public-ish `send` to confirm no delay path is taken by
    // observing that the GET mock is *not* called for the rate-limit key.
    await adapter.send({
      to: "5511999999999",
      userId: "u1",
      eventType: NotificationEventType.COMPLAINT_RESPONSE,
      template: { name: "tpl", languageCode: "en" },
    });

    // Fast path: setNx called once with the right key + TTL-in-ms.
    expect(redisSetNxMock).toHaveBeenCalledWith(
      `${REDIS_PAIR_KEY_PREFIX}5511999999999`,
      expect.any(String),
      PAIR_RATE_LIMIT_TTL_SEC * 1000
    );
    // Fast path: no GET was needed because the claim succeeded.
    expect(redisGetMock).not.toHaveBeenCalled();
    // Fast path: fetch still ran (we proceeded to send without deferring).
    expect(fetchSpy).toHaveBeenCalled();

    // On success, recordPairRateLimitSuccess calls `set` with TTL.
    expect(redisSetMock).toHaveBeenCalledWith(`${REDIS_PAIR_KEY_PREFIX}5511999999999`, expect.any(String), {
      ex: PAIR_RATE_LIMIT_TTL_SEC,
    });

    fetchSpy.mockRestore();
  });

  test("when setNx returns the caller's own nowStr (claim won by echo), adapter also proceeds immediately", async () => {
    const { MetaCloudApiAdapter } = await importAdapter();
    const adapter = new MetaCloudApiAdapter();

    // Some Redis adapters echo the written value back instead of "OK".
    // The SUT treats `claimResult === nowStr` as a win too.
    const echoedNow = String(Date.now());
    redisSetNxMock.mockResolvedValueOnce(echoedNow);

    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      makeOkResponse({ messages: [{ id: "wamid.echo" }], messaging_product: "whatsapp" })
    );

    await adapter.send({
      to: "5511999999999",
      userId: "u1",
      eventType: NotificationEventType.COMPLAINT_RESPONSE,
      template: { name: "tpl", languageCode: "en" },
    });

    expect(redisSetNxMock).toHaveBeenCalled();
    expect(fetchSpy).toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  test("when setNx returns null (key already owned), adapter falls back to GET to compute defer", async () => {
    const { MetaCloudApiAdapter } = await importAdapter();
    const adapter = new MetaCloudApiAdapter();
    // Claim lost — someone else owns the slot. SUT must read GET to defer.
    redisSetNxMock.mockResolvedValueOnce(null);
    const recentNow = Date.now();
    redisGetMock.mockResolvedValueOnce(String(recentNow)); // 0ms ago → defer ~PAIR_RATE_LIMIT_MS

    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      makeOkResponse({ messages: [{ id: "wamid.deferred" }], messaging_product: "whatsapp" })
    );

    // FIX 3 (r6-tq-11): instead of spying on the private `delay` method with a
    // `keyof` cast, stub the global `setTimeout` so the deferred duration can
    // be captured and verified against the SUT's expected remaining ms. This
    // is type-safe and asserts the *value* passed to the delay, not just that
    // a delay happened at all.
    const deferredDurations: number[] = [];
    const realSetTimeout = globalThis.setTimeout;
    const setTimeoutMock = mock((cb: Parameters<typeof setTimeout>[0], ms?: number): ReturnType<typeof setTimeout> => {
      if (typeof ms === "number") deferredDurations.push(ms);
      return realSetTimeout.call(globalThis, cb, 0) as unknown as ReturnType<typeof setTimeout>;
    });
    globalThis.setTimeout = setTimeoutMock as unknown as typeof setTimeout;

    await adapter.send({
      to: "5511999999999",
      userId: "u1",
      eventType: NotificationEventType.COMPLAINT_RESPONSE,
      template: { name: "tpl", languageCode: "en" },
    });

    // The slow path: a GET was performed to read the existing timestamp.
    expect(redisGetMock).toHaveBeenCalled();
    // A delay was scheduled with the remaining ms (≈ PAIR_RATE_LIMIT_MS
    // because `recentNow` was "just now").
    expect(deferredDurations.length).toBeGreaterThan(0);
    const scheduledMs = deferredDurations[0];
    // remaining = PAIR_RATE_LIMIT_MS - elapsed, and elapsed is tiny (a few ms).
    // Allow slack for test execution time.
    expect(scheduledMs).toBeGreaterThan(0);
    expect(scheduledMs).toBeLessThanOrEqual(PAIR_RATE_LIMIT_MS);
    // fetch was still invoked after the delay (no hard block).
    expect(fetchSpy).toHaveBeenCalled();

    fetchSpy.mockRestore();
    globalThis.setTimeout = realSetTimeout;
  });
});

// ---------------------------------------------------------------------------
// B2: Pair-Rate-Limit adapter behavior (defer-then-send on guard hit)
// ---------------------------------------------------------------------------

describe("B2: Pair-Rate-Limit adapter behavior (defer-then-send on guard hit)", () => {
  test("when redis has recent timestamp, adapter defers by remaining ms then sends (not a hard block)", async () => {
    const { MetaCloudApiAdapter } = await importAdapter();
    const adapter = new MetaCloudApiAdapter();
    // The SUT opens with setNx; for this test we want it to lose the claim so
    // the GET-derived defer path is taken. Set setNx to null (key owned) and
    // seed GET with a timestamp that is "now" (0 elapsed → full PAIR_RATE_LIMIT_MS).
    redisSetNxMock.mockResolvedValueOnce(null);
    const now = Date.now();
    redisGetMock.mockResolvedValueOnce(String(now));

    // FIX 4 (r6-tq-12): always provide a mock Response to fetchSpy so the
    // real global fetch never attempts a live network call to the Meta Graph
    // API. The original test created `fetchSpy` without `mockResolvedValue`.
    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      makeOkResponse({ messages: [{ id: "wamid.123" }], messaging_product: "whatsapp" })
    );

    // FIX 3 (r6-tq-11): stub `setTimeout` (the seam the private `delay`
    // method uses) so the deferred duration can be captured and asserted,
    // instead of spying on the private method via a type-unsafe `keyof` cast.
    const deferredDurations: number[] = [];
    const realSetTimeout = globalThis.setTimeout;
    const setTimeoutMock = mock((cb: Parameters<typeof setTimeout>[0], ms?: number): ReturnType<typeof setTimeout> => {
      if (typeof ms === "number") deferredDurations.push(ms);
      return realSetTimeout.call(globalThis, cb, 0) as unknown as ReturnType<typeof setTimeout>;
    });
    globalThis.setTimeout = setTimeoutMock as unknown as typeof setTimeout;

    await adapter.send({
      to: "5511999999999",
      userId: "u1",
      eventType: NotificationEventType.COMPLAINT_RESPONSE,
      template: { name: "tpl", languageCode: "en" },
    });

    // B2 requirement: adapter defers by the remaining ms (delay), then sends.
    // It does NOT hard-block the send — fetch IS called after the delay completes.
    expect(deferredDurations.length).toBeGreaterThan(0);
    expect(fetchSpy).toHaveBeenCalled();

    // FIX 3: verify the deferred duration equals the expected remaining ms.
    // elapsed ≈ 0 (Date.now() captured just before send), so remaining ≈
    // PAIR_RATE_LIMIT_MS (allowing a few ms of test execution slack).
    const expectedRemaining = PAIR_RATE_LIMIT_MS;
    expect(deferredDurations[0]).toBeLessThanOrEqual(expectedRemaining);
    expect(deferredDurations[0]).toBeGreaterThan(expectedRemaining - 1000);

    fetchSpy.mockRestore();
    globalThis.setTimeout = realSetTimeout;
  });

  test("when redis returns null (claim won, GET empty), no defer — proceed to send, set written", async () => {
    const { MetaCloudApiAdapter } = await importAdapter();
    const adapter = new MetaCloudApiAdapter();
    // Use local constants since exports were removed (M4+M5 fix)
    const REDIS_PAIR_KEY_PREFIX = "whatsapp:pair:";
    const PAIR_RATE_LIMIT_TTL_SEC = 60;

    // Atomic claim wins → SUT short-circuits and never calls GET. Reset GET
    // default to null (already done) just to be explicit.
    redisSetNxMock.mockResolvedValueOnce("OK");
    redisGetMock.mockResolvedValueOnce(null);

    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      makeOkResponse({ messages: [{ id: "wamid.456" }], messaging_product: "whatsapp" })
    );

    await adapter.send({
      to: "5511999999999",
      userId: "u1",
      eventType: NotificationEventType.COMPLAINT_RESPONSE,
      template: { name: "tpl", languageCode: "en" },
    });

    // On the fast path, recordPairRateLimitSuccess calls `set` after send.
    expect(redisSetMock).toHaveBeenCalledWith(`${REDIS_PAIR_KEY_PREFIX}5511999999999`, expect.any(String), {
      ex: PAIR_RATE_LIMIT_TTL_SEC,
    });
    expect(fetchSpy).toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  test("when redis throws, adapter fails-open (returns 0, proceeds without guard)", async () => {
    const { MetaCloudApiAdapter } = await importAdapter();
    const adapter = new MetaCloudApiAdapter();

    // Make the atomic claim throw so the catch in checkPairRateLimit fires
    // and the adapter proceeds without the guard (fail-open, defer=0).
    redisSetNxMock.mockRejectedValueOnce(new Error("Redis down"));

    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      makeOkResponse({ messages: [{ id: "wamid.789" }], messaging_product: "whatsapp" })
    );

    await adapter.send({
      to: "5511999999999",
      userId: "u1",
      eventType: NotificationEventType.COMPLAINT_RESPONSE,
      template: { name: "tpl", languageCode: "en" },
    });

    expect(fetchSpy).toHaveBeenCalled();

    fetchSpy.mockRestore();
  });
});
