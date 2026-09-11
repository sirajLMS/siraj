import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import type { IRedisService } from "@/backend/services/redis/IRedisService";
import { SessionRedisService } from "@/backend/services/redis/SessionRedisService";
import type { RedisSessionData } from "@/backend/types";

function createMockRedis(): IRedisService {
  const store = new Map<string, string>();
  return {
    get: mock(async (key: string) => store.get(key) ?? null),
    set: mock(async (key: string, value: string, _options?: { ex?: number; px?: number }) => {
      store.set(key, value);
    }),
    setNx: mock(async (key: string, value: string, _pxMs: number) => {
      if (store.has(key)) return null;
      store.set(key, value);
      return "OK";
    }),
    incr: mock(async () => 1),
    expire: mock(async () => {}),
    ttl: mock(async () => 3600),
    del: mock(async (key: string) => {
      store.delete(key);
    }),
    pipeline: mock(async () => []),
    ping: mock(async () => true),
    disconnect: mock(async () => {}),
    stats: mock(async () => ({ provider: "mock", size: store.size, hitsByPrefix: {} })),
  };
}

describe("SessionRedisService", () => {
  afterEach(() => {
    mock.restore();
  });

  const validSession: RedisSessionData = {
    userId: "user_123",
    hashedId: "hash_456",
    payload: "payload_789",
    ipAddress: "127.0.0.1",
    userAgent: "Mozilla/5.0",
    deviceType: "desktop",
    deviceName: "Chrome",
    createdAt: "2025-01-01T00:00:00.000Z",
    lastActivityAt: "2025-01-01T00:01:00.000Z",
    impersonation: {
      targetUserId: "target_1",
      startedAt: "2025-01-01T00:00:00.000Z",
      expiresAt: "2025-01-01T01:00:00.000Z",
      impersonationSessionId: "imp_1",
      reason: "Support ticket",
    },
    groupSimulation: {
      groupSlug: "admin_group",
      startedAt: "2025-01-01T00:00:00.000Z",
      expiresAt: "2025-01-01T01:00:00.000Z",
    },
  };

  test("returns parsed session data when valid JSON string is stored", async () => {
    const redis = createMockRedis();
    const service = new SessionRedisService(redis);

    await redis.set("session:sess_1", JSON.stringify(validSession));

    const result = await service.getSession("sess_1");
    expect(result).toEqual(validSession);
  });

  test("returns null when session is not found in Redis", async () => {
    const redis = createMockRedis();
    const service = new SessionRedisService(redis);

    const result = await service.getSession("sess_missing");
    expect(result).toBeNull();
  });

  test("returns null when session data is non-object (e.g. number or array)", async () => {
    const redis = createMockRedis();
    const service = new SessionRedisService(redis);

    await redis.set("session:sess_num", "12345");
    expect(await service.getSession("sess_num")).toBeNull();

    await redis.set("session:sess_arr", "[1, 2, 3]");
    expect(await service.getSession("sess_arr")).toBeNull();
  });

  async function assertInvalidSessionReturnsNull(sessionId: string, invalidPayload: unknown) {
    const redis = createMockRedis();
    const service = new SessionRedisService(redis);

    await redis.set(`session:${sessionId}`, JSON.stringify(invalidPayload));
    const result = await service.getSession(sessionId);
    expect(result).toBeNull();
  }

  test("returns null when required field is missing or not a string", async () => {
    await assertInvalidSessionReturnsNull("sess_bad_user", { ...validSession, userId: 123 });
  });

  test("returns null when optional string field is invalid type", async () => {
    await assertInvalidSessionReturnsNull("sess_bad_ip", { ...validSession, ipAddress: 127001 });
  });

  test("returns null when impersonation sub-object is invalid", async () => {
    await assertInvalidSessionReturnsNull("sess_bad_imp", {
      ...validSession,
      impersonation: { ...validSession.impersonation, targetUserId: 999 },
    });
  });

  test("returns null when groupSimulation sub-object is invalid", async () => {
    await assertInvalidSessionReturnsNull("sess_bad_gsim", {
      ...validSession,
      groupSimulation: { ...validSession.groupSimulation, groupSlug: null },
    });
  });

  test("stores session using setSession", async () => {
    const redis = createMockRedis();
    const service = new SessionRedisService(redis);

    await service.setSession({
      sessionId: "sess_2",
      data: validSession,
      ttlSeconds: 1800,
    });

    expect(redis.set).toHaveBeenCalledWith("session:sess_2", JSON.stringify(validSession), { ex: 1800 });
  });

  test("returns parsed session data when auto-deserialized object is returned", async () => {
    const redis = createMockRedis();
    const service = new SessionRedisService(redis);

    // Simulate a client that auto-deserializes JSON into an object
    // (JSON.parse returns any here intentionally: the runtime value is an object,
    // while the typed surface still claims string | null)
    const objectValue: string | null = JSON.parse(JSON.stringify(validSession));
    spyOn(redis, "get").mockResolvedValueOnce(objectValue);

    const result = await service.getSession("sess_1");
    expect(result).toEqual(validSession);
  });
});
