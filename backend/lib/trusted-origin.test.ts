import { describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { resolveTrustedOrigin } from "@/backend/lib/trusted-origin";

const APP_URL = "http://localhost:3000/dashboard";

function requestWith(headers: Record<string, string>): NextRequest {
  return new NextRequest(APP_URL, { headers });
}

describe("resolveTrustedOrigin", () => {
  test("falls back to the request origin when no host header is present", () => {
    const request = new NextRequest(APP_URL);
    expect(resolveTrustedOrigin(request)).toBe("http://localhost:3000");
  });

  test("rejects an unknown X-Forwarded-Host and never interpolates it", () => {
    const origin = resolveTrustedOrigin(requestWith({ "x-forwarded-host": "evil-attacker.com" }));
    expect(origin).toBe("http://localhost:3000");
    expect(origin).not.toContain("evil-attacker.com");
  });

  test("accepts a host matching the request URL host", () => {
    expect(resolveTrustedOrigin(requestWith({ host: "localhost:3000" }))).toBe("http://localhost:3000");
  });

  test("honours a TLS-terminating proxy scheme for a trusted host", () => {
    expect(resolveTrustedOrigin(requestWith({ host: "localhost:3000", "x-forwarded-proto": "https" }))).toBe(
      "https://localhost:3000"
    );
  });

  test("uses the client-facing entry of a comma-separated X-Forwarded-Proto chain", () => {
    expect(resolveTrustedOrigin(requestWith({ host: "localhost:3000", "x-forwarded-proto": "https, http" }))).toBe(
      "https://localhost:3000"
    );
  });

  test("rejects non-http(s) schemes instead of building a redirect target from them", () => {
    expect(resolveTrustedOrigin(requestWith({ host: "localhost:3000", "x-forwarded-proto": "javascript" }))).toBe(
      "http://localhost:3000"
    );
  });

  test("falls back safely when the host header is not a parseable URL authority", () => {
    const origin = resolveTrustedOrigin(requestWith({ "x-forwarded-host": "invalid host with spaces.com" }));
    expect(origin).toBe("http://localhost:3000");
  });

  test("accepts a bracketed IPv6 host matching the request URL host", () => {
    const request = new NextRequest("https://[2001:db8::1]:3000/dashboard", {
      headers: { host: "[2001:db8::1]:3000" },
    });
    expect(resolveTrustedOrigin(request)).toBe("https://[2001:db8::1]:3000");
  });
});
