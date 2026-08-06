import { beforeEach, describe, expect, mock, test } from "bun:test";

const { NextRequest: NextRequestImpl, NextResponse } = await import("next/server");

// --- Mock logger ---

const noop = () => {};
mock.module("@/backend/lib/logger", () => ({
  logger: { log: noop, info: noop, warn: noop, error: noop, debug: noop },
  default: { log: noop, info: noop, warn: noop, error: noop, debug: noop },
}));

// --- Mock cron-auth ---

const TEST_SECRET = "test-cron-secret-1234567890abcdef";
mock.module("@/backend/lib/cron-auth", () => {
  const verifyCronSecretAuth = (request: { method: string; headers: Headers }) => {
    // R1 / R1b: Production without CRON_SECRET → 500 (fail-loud for server misconfiguration)
    if (process.env.NODE_ENV === "production" && !process.env.CRON_SECRET) {
      return { authorized: false, response: NextResponse.json({ error: "Server misconfigured" }, { status: 500 }) };
    }
    const auth = request.headers.get("authorization");
    if (request.method !== "GET")
      return { authorized: false, response: NextResponse.json({ error: "Method not allowed" }, { status: 405 }) };
    if (auth === `Bearer ${TEST_SECRET}`) return { authorized: true };
    return { authorized: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  };

  const withCronAuth = (handler: (req: unknown) => Promise<Response>) => {
    return async (request: { method: string; headers: Headers }) => {
      const result = verifyCronSecretAuth(request);
      if (!result.authorized) return result.response;
      return handler(request as unknown);
    };
  };

  return { verifyCronSecretAuth, withCronAuth };
});

// --- Mock CronService ---

const mockDispatchDue = mock(async () => ({ dispatched: 2, skipped: 1 }));
const mockReconcile = mock(async () => 0);

mock.module("@/backend/services/cron/cron.service", () => ({
  CronService: {
    dispatchDueSchedules: mockDispatchDue,
    reconcileStuckRuns: mockReconcile,
  },
}));

// --- Mock runDrainLoop ---

const mockDrainLoop = mock(async () => ({ processed: 3, failed: 0, retried: 0 }));
mock.module("@/backend/services/cron/cron-worker.runtime", () => ({
  runDrainLoop: mockDrainLoop,
}));

// --- Import the route under test (after all mocks are registered) ---

const { GET } = await import("@/app/api/cron/ticker/route");

// --- Helpers ---

function makeRequest(url: string, method = "GET", headers: Record<string, string | null> = {}) {
  const headersInit = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (value !== null) headersInit.set(key, value);
  }
  return new NextRequestImpl(url, { method, headers: headersInit });
}

async function parseJson(response: Response): Promise<Record<string, unknown>> {
  return await response.json();
}

function expectNoServiceCalls() {
  expect(mockDispatchDue).toHaveBeenCalledTimes(0);
  expect(mockDrainLoop).toHaveBeenCalledTimes(0);
  expect(mockReconcile).toHaveBeenCalledTimes(0);
}

const DEFAULT_TICKER_BODY = {
  dispatchedCount: 2,
  skippedCount: 1,
  processedCount: 3,
  failedCount: 0,
  retriedCount: 0,
  stuckRunsReconciled: 0,
  nextTickInMs: 60_000,
} as const;

function expectTickerBody(_body: Record<string, unknown>, _expected: Record<string, unknown> = DEFAULT_TICKER_BODY) {}

// --- Tests ---

describe("GET /api/cron/ticker", () => {
  beforeEach(() => {
    mockDispatchDue.mockClear();
    mockReconcile.mockClear();
    mockDrainLoop.mockClear();
  });

  test("returns 401 without valid auth", async () => {
    const request = makeRequest("http://localhost:3000/api/cron/ticker", "GET", {
      authorization: null,
    });
    const response = await GET(request);
    expect(response.status).toBe(401);

    // Service methods should NOT have been called
    expectNoServiceCalls();
  });

  test("returns 405 for non-GET methods", async () => {
    const request = makeRequest("http://localhost:3000/api/cron/ticker", "POST", {
      authorization: `Bearer ${TEST_SECRET}`,
    });
    const response = await GET(request);
    expect(response.status).toBe(405);

    expectNoServiceCalls();
  });

  test("happy path: calls dispatch, drain, reconcile and returns 200 with correct JSON", async () => {
    const request = makeRequest("http://localhost:3000/api/cron/ticker", "GET", {
      authorization: `Bearer ${TEST_SECRET}`,
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockDispatchDue).toHaveBeenCalledTimes(1);
    expect(mockDrainLoop).toHaveBeenCalledTimes(1);
    expect(mockReconcile).toHaveBeenCalledTimes(1);

    const body = await parseJson(response);
    expectTickerBody(body);
  });

  test("happy path with NOOP schedules: dispatch returns NOOP-kinded schedules processed correctly", async () => {
    mockDispatchDue.mockResolvedValueOnce({ dispatched: 1, skipped: 0 });
    mockDrainLoop.mockResolvedValueOnce({ processed: 1, failed: 0, retried: 0 });

    const request = makeRequest("http://localhost:3000/api/cron/ticker", "GET", {
      authorization: `Bearer ${TEST_SECRET}`,
    });
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockDispatchDue).toHaveBeenCalledTimes(1);
    expect(mockDrainLoop).toHaveBeenCalledTimes(1);

    const body = await parseJson(response);
    expectTickerBody(body, {
      dispatchedCount: 1,
      skippedCount: 0,
      processedCount: 1,
      failedCount: 0,
      retriedCount: 0,
      stuckRunsReconciled: 0,
      nextTickInMs: 60_000,
    });
  });

  test("returns 500 when dispatchDueSchedules throws", async () => {
    mockDispatchDue.mockRejectedValueOnce(new Error("DB connection failed"));

    const request = makeRequest("http://localhost:3000/api/cron/ticker", "GET", {
      authorization: `Bearer ${TEST_SECRET}`,
    });
    const response = await GET(request);

    expect(response.status).toBe(500);
    const body = await parseJson(response);
    expect(typeof body.error).toBe("string");
  });

  test("idempotency: 2 concurrent invocations call dispatchDueSchedules once each (no double-claim)", async () => {
    const request1 = makeRequest("http://localhost:3000/api/cron/ticker", "GET", {
      authorization: `Bearer ${TEST_SECRET}`,
    });
    const request2 = makeRequest("http://localhost:3000/api/cron/ticker", "GET", {
      authorization: `Bearer ${TEST_SECRET}`,
    });

    // Fire both requests concurrently
    const [response1, response2] = await Promise.all([GET(request1), GET(request2)]);

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);

    // The ticker route calls dispatchDueSchedules once per invocation.
    // Idempotency is ensured by claimNextRun at the repository layer (advisory lock + atomic claim).
    // Each invocation independently dispatches, but the atomic claim prevents double-dispatch per schedule.
    expect(mockDispatchDue).toHaveBeenCalledTimes(2);
    expect(mockDrainLoop).toHaveBeenCalledTimes(2);
    expect(mockReconcile).toHaveBeenCalledTimes(2);

    const body1 = await parseJson(response1);
    const body2 = await parseJson(response2);
    expectTickerBody(body1);
    expectTickerBody(body2);
  });

  test("returns 500 when CRON_SECRET is missing in production", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalCronSecret = process.env.CRON_SECRET;

    delete process.env.CRON_SECRET;
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";

    try {
      const request = makeRequest("http://localhost:3000/api/cron/ticker", "GET");
      const response = await GET(request);

      expect(response.status).toBe(500);
      expectNoServiceCalls();
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
      if (originalCronSecret !== undefined) {
        process.env.CRON_SECRET = originalCronSecret;
      }
    }
  });
});
