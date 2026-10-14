import { describe, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";

const mockCheckRateLimit = mock(async () => ({
  success: true,
  limit: 100,
  remaining: 99,
  reset: Date.now() + 60_000,
}));

mock.module("@/backend/lib/ratelimit", () => ({
  apiRateLimiter: {},
  checkRateLimit: mockCheckRateLimit,
  getClientIdentifier: () => "127.0.0.1",
}));

import { GET as setLocaleGET, POST as setLocalePOST } from "@/app/api/set-locale/route";
import { GET as logoutGET } from "@/app/logout/route";

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
    });

    test("accepts TLS-terminated request with X-Forwarded-Proto https when host matches request.nextUrl.host", async () => {
      const res = await setLocaleGET(
        setLocaleRequest({ origin: BASE_URL, host: "localhost:3000", "x-forwarded-proto": "https" })
      );
      assertRedirect(res, `https://localhost:3000/dashboard`);
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
    });

    test("returns 429 when rate limit is exceeded for GET", async () => {
      mockCheckRateLimit.mockResolvedValueOnce({
        success: false,
        limit: 100,
        remaining: 0,
        reset: Date.now() + 60_000,
      });
      const res = await setLocaleGET(setLocaleRequest({ origin: BASE_URL }));
      expect(res.status).toBe(429);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe("POST /api/set-locale", () => {
    test("returns 429 when rate limit is exceeded for POST", async () => {
      mockCheckRateLimit.mockResolvedValueOnce({
        success: false,
        limit: 100,
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
      const data = await res.json();
      expect(data.error).toBeDefined();
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
