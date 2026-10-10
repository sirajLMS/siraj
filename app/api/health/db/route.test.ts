import { beforeEach, describe, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";

const PROBE_URL = "http://localhost:3000/api/health/db";

const mockQueryExecute = mock(async () => [{ "?column?": 1 }]);
await mock.module("@/backend/db", () => ({
  queryDb: () => ({
    execute: mockQueryExecute,
  }),
}));

const mockLoggerWarn = mock(() => {});
await mock.module("@/backend/lib/logger", () => ({
  logger: {
    warn: mockLoggerWarn,
    debug: () => {},
    error: () => {},
    info: () => {},
  },
}));

const mockCheckRateLimit = mock(async () => ({
  success: true,
  limit: 200,
  remaining: 199,
  reset: Date.now() + 60_000,
}));

await mock.module("@/backend/lib/ratelimit", () => ({
  apiRateLimiter: {},
  checkRateLimit: mockCheckRateLimit,
  getClientIdentifier: () => "127.0.0.1",
  rateLimitLogId: (id: string) => `hashed:${id}`,
}));

const { GET } = await import("@/app/api/health/db/route");

function mockRateLimitOutcome(success: boolean, remaining: number) {
  return mockCheckRateLimit.mockResolvedValueOnce({
    success,
    limit: 200,
    remaining,
    reset: Date.now() + 60_000,
  });
}

function runProbe(): Promise<Response> {
  return GET(new NextRequest(PROBE_URL));
}

async function expectProbeResponse(res: Response, expectedStatus: number, expectedBody: object) {
  expect(res.status).toBe(expectedStatus);
  expect(await res.json()).toEqual(expectedBody);
}

function expectSingleProbe(expectedQueryCalls: number) {
  expect(mockCheckRateLimit).toHaveBeenCalledTimes(1);
  expect(mockQueryExecute).toHaveBeenCalledTimes(expectedQueryCalls);
}

describe("GET /api/health/db", () => {
  beforeEach(() => {
    mockQueryExecute.mockClear();
    mockCheckRateLimit.mockClear();
    mockLoggerWarn.mockClear();
  });

  test("returns 200 { status: 'ok' } when rate limit passes and DB query succeeds", async () => {
    mockRateLimitOutcome(true, 199);

    const res = await runProbe();

    await expectProbeResponse(res, 200, { status: "ok" });
    expectSingleProbe(1);
  });

  test("returns 429 { status: 'unavailable' } when rate limit is exceeded", async () => {
    mockRateLimitOutcome(false, 0);

    const res = await runProbe();

    await expectProbeResponse(res, 429, { status: "unavailable" });
    expectSingleProbe(0);
    expect(mockLoggerWarn).toHaveBeenCalledWith("DB health probe rate limit exceeded", {
      rateLimitLogId: "hashed:health-db:127.0.0.1",
    });
  });

  test("returns 503 { status: 'unavailable' } when DB query fails", async () => {
    mockRateLimitOutcome(true, 199);
    mockQueryExecute.mockRejectedValueOnce(new Error("DB connection error"));

    const res = await runProbe();

    await expectProbeResponse(res, 503, { status: "unavailable" });
    expectSingleProbe(1);
  });
});
