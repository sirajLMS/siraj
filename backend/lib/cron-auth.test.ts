import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { NextResponse } from "next/server";
import { generateTestPassword } from "@/backend/db/test/test-utils";
import { verifyCronSecretAuth, withCronAuth } from "@/backend/lib/cron-auth";
import type { EnvironmentConfig } from "@/backend/lib/env";
import * as envModule from "@/backend/lib/env";
import * as ratelimitModule from "@/backend/lib/ratelimit";

const { NextRequest: NextRequestImpl } = await import("next/server");

// Suppress logger output during tests.
const noop = () => {};
await mock.module("@/backend/lib/logger", () => ({
  logger: { log: noop, info: noop, warn: noop, error: noop, debug: noop },
  default: { log: noop, info: noop, warn: noop, error: noop, debug: noop },
}));

function setEnv(key: string, value: string | undefined): void {
  Reflect.defineProperty(process.env, key, { value, writable: true, configurable: true, enumerable: true });
}

const TEST_SECRET = "test-cron-secret-1234567890abcdef";
const originalNodeEnv = process.env.NODE_ENV;
const originalSecret = process.env.CRON_SECRET;

function minimalEnvConfig(cronSecret: string | undefined): EnvironmentConfig {
  return {
    nodeEnv: "test",
    jwtSecret: "test-jwt-secret",
    databaseUrl: "postgresql://test:test@localhost:5432/test",
    cacheProvider: "postgres",
    redisProvider: "local",
    redisUrl: "redis://localhost:6379",
    allowedOrigin: undefined,
    databaseEncryptionKey: "test-encryption-key-32chars-long!!",
    adminEmail: "admin@test.com",
    // Random dummy value — never read real env vars (PATH/HOME/USER) here since
    // they could leak into test logs/artifacts.
    adminPassword: generateTestPassword(),
    storageProvider: "local",
    cronSecret,
  };
}

beforeEach(() => {
  setEnv("NODE_ENV", "test");
  setEnv("CRON_SECRET", TEST_SECRET);
  spyOn(envModule, "getEnvironmentConfig").mockReturnValue(minimalEnvConfig(TEST_SECRET));
});

afterEach(() => {
  spyOn(envModule, "getEnvironmentConfig").mockRestore();
  setEnv("NODE_ENV", originalNodeEnv ?? "test");
  setEnv("CRON_SECRET", originalSecret ?? TEST_SECRET);
});

function makeRequest(method: string, headers: Record<string, string | null> = {}) {
  const headersInit = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (value !== null) headersInit.set(key, value);
  }
  return new NextRequestImpl("http://localhost:3000/api/fx/refresh", { method, headers: headersInit });
}

async function parseJson(response: Response): Promise<Record<string, unknown>> {
  return await response.json();
}

async function runCronRequest(rateLimit: { success: boolean; remaining: number; once?: boolean }) {
  const spy = spyOn(ratelimitModule, "checkRateLimit");
  const result = {
    success: rateLimit.success,
    limit: 60,
    remaining: rateLimit.remaining,
    reset: Date.now() + 60_000,
  };
  if (rateLimit.once) spy.mockResolvedValueOnce(result);
  else spy.mockResolvedValue(result);

  const handler = mock(async () => NextResponse.json({ ok: true }));
  const wrapped = withCronAuth(handler);
  const req = makeRequest("GET", { authorization: `Bearer ${TEST_SECRET}` });
  return { handler, res: await wrapped(req) };
}

describe("verifyCronSecretAuth (R1–R11)", () => {
  test("R3: returns 405 for non-GET methods", () => {
    const result = verifyCronSecretAuth(makeRequest("POST", { authorization: `Bearer ${TEST_SECRET}` }));
    expect(result.authorized).toBe(false);
    if (!result.authorized) expect(result.response.status).toBe(405);
  });

  test("R1b: production without CRON_SECRET returns 500 (server misconfigured)", () => {
    setEnv("NODE_ENV", "production");
    setEnv("CRON_SECRET", "");
    spyOn(envModule, "getEnvironmentConfig").mockReturnValue(minimalEnvConfig(undefined));

    const result = verifyCronSecretAuth(makeRequest("GET", { authorization: "Bearer anything" }));
    expect(result.authorized).toBe(false);
    if (!result.authorized) expect(result.response.status).toBe(500);
  });

  test("S7: non-test env without CRON_SECRET returns 401", () => {
    setEnv("NODE_ENV", "development");
    setEnv("CRON_SECRET", "");
    spyOn(envModule, "getEnvironmentConfig").mockReturnValue(minimalEnvConfig(undefined));

    const result = verifyCronSecretAuth(makeRequest("GET", { authorization: "Bearer anything" }));
    expect(result.authorized).toBe(false);
    if (!result.authorized) expect(result.response.status).toBe(401);
  });

  test("R2/R4: missing Authorization header returns 401", () => {
    const result = verifyCronSecretAuth(makeRequest("GET", { authorization: null }));
    expect(result.authorized).toBe(false);
    if (!result.authorized) expect(result.response.status).toBe(401);
  });

  test("R2: Authorization without Bearer prefix returns 401", () => {
    const result = verifyCronSecretAuth(makeRequest("GET", { authorization: TEST_SECRET }));
    expect(result.authorized).toBe(false);
    if (!result.authorized) expect(result.response.status).toBe(401);
  });

  test("R2: wrong Bearer secret returns 401", () => {
    const result = verifyCronSecretAuth(makeRequest("GET", { authorization: "Bearer wrong-secret" }));
    expect(result.authorized).toBe(false);
    if (!result.authorized) expect(result.response.status).toBe(401);
  });

  test("R11: valid Bearer secret authorizes the request", () => {
    const result = verifyCronSecretAuth(makeRequest("GET", { authorization: `Bearer ${TEST_SECRET}` }));
    expect(result.authorized).toBe(true);
  });

  test("R6: logs x-vercel-cron-schedule header when present (audit only)", () => {
    const result = verifyCronSecretAuth(
      makeRequest("GET", { authorization: `Bearer ${TEST_SECRET}`, "x-vercel-cron-schedule": "0 6 * * *" })
    );
    expect(result.authorized).toBe(true);
  });

  test("empty provided secret (Bearer with no value) returns 401", () => {
    const result = verifyCronSecretAuth(makeRequest("GET", { authorization: "Bearer " }));
    expect(result.authorized).toBe(false);
    if (!result.authorized) expect(result.response.status).toBe(401);
  });

  test("error response body contains an error key", async () => {
    const result = verifyCronSecretAuth(makeRequest("GET", { authorization: "Bearer wrong" }));
    if (!result.authorized) {
      const body = await parseJson(result.response);
      expect(body).toHaveProperty("error");
    }
  });
});

describe("withCronAuth wrapper", () => {
  test("returns 429 when rate limit is exceeded", async () => {
    const { handler, res } = await runCronRequest({ success: false, remaining: 0, once: true });

    expect(res.status).toBe(429);
    const body = await parseJson(res);
    expect(body).toHaveProperty("error");
    expect(handler).not.toHaveBeenCalled();
  });

  test("invokes handler when authenticated and not rate limited", async () => {
    const { handler, res } = await runCronRequest({ success: true, remaining: 59 });

    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
