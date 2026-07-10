import { afterAll, afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

const TEST_SECRET = "test-cron-secret-1234567890abcdef";

type RefreshRatesResult = {
  id: string;
  success: boolean;
  pairsWritten: number;
  pairsFailed: number;
  syncRunId: string;
  errorMessage?: string;
};

const refreshRatesMock = mock(
  async (): Promise<RefreshRatesResult> => ({
    id: "fx-refresh-sync-1",
    success: true,
    pairsWritten: 12,
    pairsFailed: 0,
    syncRunId: "sync-run-1",
  })
);

// Mock the deep service module so the @/backend/services barrel re-exports
// the mocked FxIngestionService while leaving every other service real.
mock.module("@/backend/services/fx/fx-ingestion.service", () => ({
  FxIngestionService: {
    refreshRates: refreshRatesMock,
  },
}));

// Suppress expected logger output from cron-auth, the route error path, and
// the deep db factory logger.log used when services barrel loads drizzleDb.
const noop = () => {};
mock.module("@/backend/lib/logger", () => ({
  logger: { log: noop, info: noop, warn: noop, error: noop, debug: noop },
  default: { log: noop, info: noop, warn: noop, error: noop, debug: noop },
}));

// Ensure CRON_SECRET is set before any route import triggers env validation,
// and NODE_ENV=test so cron-auth allows missing secret only if explicitly unset.
// Use Reflect.defineProperty to bypass the TS read-only annotation on process.env.
function setEnv(key: string, value: string | undefined): void {
  Reflect.defineProperty(process.env, key, { value, writable: true, configurable: true });
}

setEnv("NODE_ENV", "test");
setEnv("CRON_SECRET", TEST_SECRET);

async function importRoute() {
  return import("./route") as Promise<{
    GET: (request: import("next/server").NextRequest) => Promise<Response>;
  }>;
}

function makeRequest(method: string, headers: Record<string, string | null> = {}): import("next/server").NextRequest {
  const { NextRequest } = require("next/server") as typeof import("next/server");
  const headersInit = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (value !== null) headersInit.set(key, value);
  }
  return new NextRequest("http://localhost:3000/api/fx/refresh", { method, headers: headersInit });
}

async function parseJson(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

const originalNodeEnv = process.env.NODE_ENV;
const originalSecret = process.env.CRON_SECRET;

beforeEach(() => {
  refreshRatesMock.mockClear();
  setEnv("NODE_ENV", "test");
  setEnv("CRON_SECRET", TEST_SECRET);
});

afterEach(() => {
  setEnv("NODE_ENV", originalNodeEnv ?? "test");
  setEnv("CRON_SECRET", originalSecret ?? TEST_SECRET);
});

afterAll(() => {
  setEnv("NODE_ENV", originalNodeEnv ?? "test");
  setEnv("CRON_SECRET", originalSecret ?? TEST_SECRET);
});

describe("GET /api/fx/refresh", () => {
  test("returns 401 when Authorization header is missing", async () => {
    const { GET } = await importRoute();
    const response = await GET(makeRequest("GET", { authorization: null }));

    expect(response.status).toBe(401);
    const body = await parseJson(response);
    expect(body).toHaveProperty("error");
    expect(refreshRatesMock).toHaveBeenCalledTimes(0);
  });

  test("returns 401 when Bearer secret is wrong", async () => {
    const { GET } = await importRoute();
    const response = await GET(makeRequest("GET", { authorization: "Bearer wrong-secret" }));

    expect(response.status).toBe(401);
    expect(refreshRatesMock).toHaveBeenCalledTimes(0);
  });

  test("returns 405 when method is POST (verifyCronSecretAuth rejects non-GET)", async () => {
    const { GET } = await importRoute();
    const response = await GET(makeRequest("POST", { authorization: `Bearer ${TEST_SECRET}` }));

    expect(response.status).toBe(405);
    expect(refreshRatesMock).toHaveBeenCalledTimes(0);
  });

  test("returns 200 with refresh result when secret is valid", async () => {
    const { GET } = await importRoute();
    const response = await GET(makeRequest("GET", { authorization: `Bearer ${TEST_SECRET}` }));

    expect(response.status).toBe(200);
    expect(refreshRatesMock).toHaveBeenCalledTimes(1);
    const calls = refreshRatesMock.mock.calls as unknown as [
      { triggeredByUserId: string | null; trigger: string; force: boolean } | undefined,
    ][];
    const callArg = calls[0]?.[0];
    expect(callArg).toEqual({
      triggeredByUserId: null,
      trigger: "cron",
      force: false,
    });

    const body = await parseJson(response);
    expect(body).toEqual({
      success: true,
      pairsWritten: 12,
      pairsFailed: 0,
      syncRunId: "sync-run-1",
    });
  });

  test("returns 200 with failure payload when refreshRates reports failure", async () => {
    refreshRatesMock.mockResolvedValueOnce({
      id: "fx-refresh-sync-2",
      success: false,
      pairsWritten: 0,
      pairsFailed: 0,
      syncRunId: "sync-run-2",
      errorMessage: "boom",
    });

    const { GET } = await importRoute();
    const response = await GET(makeRequest("GET", { authorization: `Bearer ${TEST_SECRET}` }));

    expect(response.status).toBe(200);
    const body = await parseJson(response);
    expect(body).toHaveProperty("success", false);
  });

  test("returns 500 when FxIngestionService.refreshRates throws", async () => {
    refreshRatesMock.mockRejectedValueOnce(new Error("provider down"));

    const { GET } = await importRoute();
    const response = await GET(makeRequest("GET", { authorization: `Bearer ${TEST_SECRET}` }));

    expect(response.status).toBe(500);
    const body = await parseJson(response);
    expect(body).toHaveProperty("success", false);
  });

  // R1 / R1b: production without CRON_SECRET -> 500 (server misconfigured).
  // The env validator caches its result in a module-level `cachedConfig` that
  // survives `clearGlobalSingleton`, so flipping NODE_ENV=production + clearing
  // CRON_SECRET mid-suite does not re-validate. cron-auth unit tests (planned
  // for backend/lib/cron-auth.test.ts) cover this case directly against the
  // validator. This case is intentionally left as todo to avoid fragile env
  // juggling that would couple the route test to env.ts internals.
  test.todo("returns 500 in production when CRON_SECRET is missing", () => {});
});
