import { describe, expect, it, jest } from "bun:test";
import type { IRedisService } from "@/backend/services/redis/IRedisService";
import { SessionRedisService } from "@/backend/services/redis/SessionRedisService";
import type { RedisSessionData } from "@/backend/types";

function createMockRedis(): IRedisService {
  const store = new Map<string, string>();
  const mockService = {
    get: jest.fn(async (key: string) => store.get(key) ?? null),
    set: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    del: jest.fn(async (key: string) => {
      store.delete(key);
      return 1;
    }),
    exists: jest.fn(async (key: string) => (store.has(key) ? 1 : 0)),
    expire: jest.fn(async () => 1),
    ttl: jest.fn(async () => 3600),
  };
  return mockService as unknown as IRedisService;
}

describe("SessionRedisService", () => {
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

  it("returns parsed session data when valid JSON string is stored", async () => {
    const redis = createMockRedis();
    const service = new SessionRedisService(redis);

    await redis.set("session:sess_1", JSON.stringify(validSession));

    const result = await service.getSession("sess_1");
    expect(result).toEqual(validSession);
  });

  it("returns parsed session data when auto-deserialized object is returned", async () => {
    const redis = createMockRedis();
    const service = new SessionRedisService(redis);

    // Mock Redis returning object directly
    const validSessionValue = validSession as unknown as string;
    jest.spyOn(redis, "get").mockResolvedValueOnce(validSessionValue);

    const result = await service.getSession("sess_1");
    expect(result).toEqual(validSession);
  });

  it("returns null when session is not found in Redis", async () => {
    const redis = createMockRedis();
    const service = new SessionRedisService(redis);

    const result = await service.getSession("sess_missing");
    expect(result).toBeNull();
  });

  it("returns null when session data is non-object (e.g. number or array)", async () => {
    const redis = createMockRedis();
    const service = new SessionRedisService(redis);

    await redis.set("session:sess_num", "12345");
    expect(await service.getSession("sess_num")).toBeNull();

    await redis.set("session:sess_arr", "[1, 2, 3]");
    expect(await service.getSession("sess_arr")).toBeNull();
  });

  it("returns null when required field is missing or not a string", async () => {
    const redis = createMockRedis();
    const service = new SessionRedisService(redis);

    const invalid = { ...validSession, userId: 123 };
    await redis.set("session:sess_bad_user", JSON.stringify(invalid));

    const result = await service.getSession("sess_bad_user");
    expect(result).toBeNull();
  });

  it("returns null when optional string field is invalid type", async () => {
    const redis = createMockRedis();
    const service = new SessionRedisService(redis);

    const invalid = { ...validSession, ipAddress: 127001 };
    await redis.set("session:sess_bad_ip", JSON.stringify(invalid));

    const result = await service.getSession("sess_bad_ip");
    expect(result).toBeNull();
  });

  it("returns null when impersonation sub-object is invalid", async () => {
    const redis = createMockRedis();
    const service = new SessionRedisService(redis);

    const invalid = {
      ...validSession,
      impersonation: { ...validSession.impersonation, targetUserId: 999 },
    };
    await redis.set("session:sess_bad_imp", JSON.stringify(invalid));

    const result = await service.getSession("sess_bad_imp");
    expect(result).toBeNull();
  });

  it("returns null when groupSimulation sub-object is invalid", async () => {
    const redis = createMockRedis();
    const service = new SessionRedisService(redis);

    const invalid = {
      ...validSession,
      groupSimulation: { ...validSession.groupSimulation, groupSlug: null },
    };
    await redis.set("session:sess_bad_gsim", JSON.stringify(invalid));

    const result = await service.getSession("sess_bad_gsim");
    expect(result).toBeNull();
  });

  it("stores session using setSession", async () => {
    const redis = createMockRedis();
    const service = new SessionRedisService(redis);

    await service.setSession({
      sessionId: "sess_2",
      data: validSession,
      ttlSeconds: 1800,
    });

    expect(redis.set).toHaveBeenCalledWith("session:sess_2", JSON.stringify(validSession), { ex: 1800 });
  });
});
