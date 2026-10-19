import { beforeEach, describe, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";

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

const { GET: setLocaleGET, POST: setLocalePOST } = await import("@/app/api/set-locale/route");
const { GET: logoutGET } = await import("@/app/logout/route");

const BASE_URL = "http://localhost:3000";

type RequestHeaders = Record<string, string>;

const buildRequest = (path: string, headers: RequestHeaders, query?: string) =>
  new NextRequest(query ? `${BASE_URL}${path}?${query}` : `${BASE_URL}${path}`, { headers });

const setLocaleRequest = (headers: RequestHeaders) =>
  buildRequest("/api/set-locale", headers, "locale=en&redirect=/dashboard");

const assertRedirect = (res: Response, expectedLocation: string) => {
  expect(res.status).toBe(307);
  expect(res.headers.get("location")).toBe(expectedLocation);
};

describe("Rate Limiting Defense", () => {
  beforeEach(() => {
    mockCheckRateLimit.mockClear();
  });

  describe("GET /api/set-locale", () => {
    test("returns 429 when rate limit is exceeded", async () => {
      mockCheckRateLimit.mockResolvedValueOnce({
        success: false,
        limit: 200,
        remaining: 0,
        reset: Date.now() + 60_000,
      });
      const res = await setLocaleGET(setLocaleRequest({ origin: BASE_URL }));
      expect(res.status).toBe(429);
      expect(await res.json()).toHaveProperty("error");
    });
  });

  describe("POST /api/set-locale", () => {
    test("returns 429 when rate limit is exceeded", async () => {
      mockCheckRateLimit.mockResolvedValueOnce({
        success: false,
        limit: 200,
        remaining: 0,
        reset: Date.now() + 60_000,
      });
      const req = new NextRequest(`${BASE_URL}/api/set-locale`, {
        method: "POST",
        headers: { origin: BASE_URL, "content-type": "application/json" },
        body: JSON.stringify({ locale: "en" }),
      });
      const res = await setLocalePOST(req);
      expect(res.status).toBe(429);
      expect(await res.json()).toHaveProperty("error");
    });

    test("accepts valid locale payload when rate limit is not exceeded", async () => {
      const req = new NextRequest(`${BASE_URL}/api/set-locale`, {
        method: "POST",
        headers: { origin: BASE_URL, "content-type": "application/json" },
        body: JSON.stringify({ locale: "en" }),
      });
      const res = await setLocalePOST(req);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ success: true, locale: "en" });
    });
  });
});

describe("Host Header Injection Defense in Redirects", () => {
  describe("GET /api/set-locale", () => {
    test("rejects spoofed X-Forwarded-Host header and falls back to safe request.nextUrl.origin", async () => {
      const res = await setLocaleGET(setLocaleRequest({ origin: BASE_URL, "x-forwarded-host": "evil-attacker.com" }));
      const location = res.headers.get("location");
      assertRedirect(res, `${BASE_URL}/dashboard`);
      expect(location).not.toContain("evil-attacker.com");
    });

    test("accepts valid host matching request.nextUrl.host", async () => {
      const res = await setLocaleGET(setLocaleRequest({ origin: BASE_URL, host: "localhost:3000" }));
      assertRedirect(res, `${BASE_URL}/dashboard`);
      expect(res.headers.get("location")).toBe(`${BASE_URL}/dashboard`);
    });

    test("accepts TLS-terminated request with X-Forwarded-Proto https when host matches request.nextUrl.host", async () => {
      const res = await setLocaleGET(
        setLocaleRequest({ origin: BASE_URL, host: "localhost:3000", "x-forwarded-proto": "https" })
      );
      assertRedirect(res, `https://localhost:3000/dashboard`);
      expect(res.headers.get("location")).toBe(`https://localhost:3000/dashboard`);
    });

    test("falls back safely to nextUrl.origin when X-Forwarded-Host contains invalid URL characters", async () => {
      const res = await setLocaleGET(
        setLocaleRequest({ origin: BASE_URL, "x-forwarded-host": "invalid host with spaces.com" })
      );
      const location = res.headers.get("location");
      assertRedirect(res, `${BASE_URL}/dashboard`);
      expect(location).not.toContain("invalid host");
    });

    test("falls back safely to nextUrl.origin when X-Forwarded-Proto is not http(s)", async () => {
      const res = await setLocaleGET(
        setLocaleRequest({ origin: BASE_URL, host: "localhost:3000", "x-forwarded-proto": "javascript" })
      );
      assertRedirect(res, `${BASE_URL}/dashboard`);
      expect(res.headers.get("location")).toBe(`${BASE_URL}/dashboard`);
    });
  });

  describe("GET /logout", () => {
    test("rejects spoofed X-Forwarded-Host header and falls back to safe origin", async () => {
      const res = await logoutGET(buildRequest("/logout", { "x-forwarded-host": "evil-attacker.com" }));
      const location = res.headers.get("location");
      assertRedirect(res, `${BASE_URL}/login`);
      expect(location).not.toContain("evil-attacker.com");
    });
  });
});
