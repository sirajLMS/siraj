import { describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { GET as setLocaleGET } from "@/app/api/set-locale/route";
import { GET as logoutGET } from "@/app/logout/route";

describe("Host Header Injection Defense in Redirects", () => {
  describe("GET /api/set-locale", () => {
    test("rejects spoofed X-Forwarded-Host header and falls back to safe request.nextUrl.origin", async () => {
      const req = new NextRequest("http://localhost:3000/api/set-locale?locale=en&redirect=/dashboard", {
        headers: {
          origin: "http://localhost:3000",
          "x-forwarded-host": "evil-attacker.com",
        },
      });

      const res = await setLocaleGET(req);
      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toBe("http://localhost:3000/dashboard");
      expect(location).not.toContain("evil-attacker.com");
    });

    test("accepts valid host matching request.nextUrl.host", async () => {
      const req = new NextRequest("http://localhost:3000/api/set-locale?locale=en&redirect=/dashboard", {
        headers: {
          origin: "http://localhost:3000",
          host: "localhost:3000",
        },
      });

      const res = await setLocaleGET(req);
      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toBe("http://localhost:3000/dashboard");
    });

    test("accepts TLS-terminated request with X-Forwarded-Proto https when host matches request.nextUrl.host", async () => {
      const req = new NextRequest("http://localhost:3000/api/set-locale?locale=en&redirect=/dashboard", {
        headers: {
          origin: "http://localhost:3000",
          host: "localhost:3000",
          "x-forwarded-proto": "https",
        },
      });

      const res = await setLocaleGET(req);
      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toBe("https://localhost:3000/dashboard");
    });

    test("falls back safely to nextUrl.origin when X-Forwarded-Host contains invalid URL characters", async () => {
      const req = new NextRequest("http://localhost:3000/api/set-locale?locale=en&redirect=/dashboard", {
        headers: {
          origin: "http://localhost:3000",
          "x-forwarded-host": "invalid host with spaces.com",
        },
      });

      const res = await setLocaleGET(req);
      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toBe("http://localhost:3000/dashboard");
      expect(location).not.toContain("invalid host");
    });
  });

  describe("GET /logout", () => {
    test("rejects spoofed X-Forwarded-Host header and falls back to safe origin", async () => {
      const req = new NextRequest("http://localhost:3000/logout", {
        headers: {
          "x-forwarded-host": "evil-attacker.com",
        },
      });

      const res = await logoutGET(req);
      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toBe("http://localhost:3000/login");
      expect(location).not.toContain("evil-attacker.com");
    });
  });
});
