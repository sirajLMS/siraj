import { beforeEach, describe, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";

const mockQueryExecute = mock(async () => [{ "?column?": 1 }]);
await mock.module("@/backend/db", () => ({
  queryDb: () => ({
    execute: mockQueryExecute,
  }),
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
}));

const { GET } = await import("@/app/api/health/db/route");

describe("GET /api/health/db", () => {
  beforeEach(() => {
    mockQueryExecute.mockClear();
    mockCheckRateLimit.mockClear();
  });

  test("returns 200 { status: 'ok' } when rate limit passes and DB query succeeds", async () => {
    mockCheckRateLimit.mockResolvedValueOnce({
      success: true,
      limit: 200,
      remaining: 199,
      reset: Date.now() + 60_000,
    });

    const req = new NextRequest("http://localhost:3000/api/health/db");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok" });
    expect(mockCheckRateLimit).toHaveBeenCalledTimes(1);
    expect(mockQueryExecute).toHaveBeenCalledTimes(1);
  });

  test("returns 429 { status: 'unavailable' } when rate limit is exceeded", async () => {
    mockCheckRateLimit.mockResolvedValueOnce({
      success: false,
      limit: 200,
      remaining: 0,
      reset: Date.now() + 60_000,
    });

    const req = new NextRequest("http://localhost:3000/api/health/db");
    const res = await GET(req);

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body).toEqual({ status: "unavailable" });
    expect(mockCheckRateLimit).toHaveBeenCalledTimes(1);
    expect(mockQueryExecute).toHaveBeenCalledTimes(0);
  });

  test("returns 503 { status: 'unavailable' } when DB query fails", async () => {
    mockCheckRateLimit.mockResolvedValueOnce({
      success: true,
      limit: 200,
      remaining: 199,
      reset: Date.now() + 60_000,
    });
    mockQueryExecute.mockRejectedValueOnce(new Error("DB connection error"));

    const req = new NextRequest("http://localhost:3000/api/health/db");
    const res = await GET(req);

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).toEqual({ status: "unavailable" });
    expect(mockCheckRateLimit).toHaveBeenCalledTimes(1);
    expect(mockQueryExecute).toHaveBeenCalledTimes(1);
  });
});
