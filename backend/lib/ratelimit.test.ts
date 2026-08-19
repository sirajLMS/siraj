import { afterEach, describe, expect, mock, test } from "bun:test";

const mockIsTestHelperEnabled = mock(() => true);
const mockGetBooleanEnv = mock((key: string) => {
  if (key === "DISABLE_RATE_LIMITING") return false;
  if (key === "TEST_ENFORCE_RATE_LIMIT") return true;
  return false;
});

await mock.module("@/backend/lib/test-helper-gate", () => ({
  isTestHelperEnabled: mockIsTestHelperEnabled,
  assertTestHelperAllowed: mock(() => {}),
}));

await mock.module("@/backend/lib/env", () => ({
  getBooleanEnv: mockGetBooleanEnv,
}));

await mock.module("@/backend/lib/logger", () => ({
  logger: {
    info: mock((_msg: string, _ctx?: unknown) => {}),
    warn: mock((_msg: string, _ctx?: unknown) => {}),
    error: mock((_msg: string, _ctx?: unknown) => {}),
    debug: mock((_msg: string, _ctx?: unknown) => {}),
    log: mock((_msg: string, _ctx?: unknown) => {}),
  },
}));

const exceededIncrement = mock((_key: string) => Promise.resolve(101));

await mock.module("@/backend/services", () => ({
  cacheService: {
    incr: exceededIncrement,
    increment: exceededIncrement,
    get: mock((_key: string) => Promise.resolve(101)),
    expire: mock((_key: string, _ttl: number) => Promise.resolve(true)),
    del: mock((_key: string) => Promise.resolve(true)),
  },
}));

const { checkRateLimit } = await import("@/backend/lib/ratelimit");

afterEach(() => {
  mockGetBooleanEnv.mockImplementation((key: string) => key === "TEST_ENFORCE_RATE_LIMIT");
});

describe("checkRateLimit with TEST_ENFORCE_RATE_LIMIT flag", () => {
  test("rate limiter enforces in dev mode when TEST_ENFORCE_RATE_LIMIT=1", async () => {
    Object.assign(process.env, { NODE_ENV: "development" });
    mockGetBooleanEnv.mockImplementation((key: string) => key === "TEST_ENFORCE_RATE_LIMIT");

    const result = await checkRateLimit("test-identifier-1");
    expect(result.success).toBe(false);
    expect(result.limit).toBeGreaterThan(0);
  });

  test("rate limiter bypasses in dev mode when TEST_ENFORCE_RATE_LIMIT is not set", async () => {
    Object.assign(process.env, { NODE_ENV: "development" });
    mockGetBooleanEnv.mockImplementation(() => false);

    const result = await checkRateLimit("test-identifier-2");
    expect(result.success).toBe(true);
  });

  test("rate limiter enforces in production mode", async () => {
    Object.assign(process.env, { NODE_ENV: "production" });
    mockGetBooleanEnv.mockImplementation(() => false);

    const result = await checkRateLimit("test-identifier-3");
    expect(result.success).toBe(false);
  });
});
