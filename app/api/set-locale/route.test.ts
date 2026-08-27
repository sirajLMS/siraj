import { describe, expect, test } from "bun:test";

const { NextRequest } = await import("next/server");
const { GET } = await import("./route");

function makeRequest(url: string) {
  return new NextRequest(url, {
    method: "GET",
    headers: {
      host: "localhost:3000",
    },
  });
}

describe("GET /api/set-locale open redirect prevention", () => {
  test("redirects to valid same-origin relative path", async () => {
    const req = makeRequest("http://localhost:3000/api/set-locale?locale=en&redirect=/dashboard");
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  test("blocks protocol-relative open redirect (//evil.com)", async () => {
    const req = makeRequest("http://localhost:3000/api/set-locale?locale=en&redirect=//evil.com");
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/");
  });

  test("blocks backslash normalized open redirect (/\\\\evil.com)", async () => {
    const req = makeRequest("http://localhost:3000/api/set-locale?locale=en&redirect=/\\\\evil.com");
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/");
  });

  test("blocks single backslash open redirect (/\\evil.com)", async () => {
    const req = makeRequest("http://localhost:3000/api/set-locale?locale=en&redirect=/\\evil.com");
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/");
  });

  test("blocks scheme-containing redirect (https://evil.com)", async () => {
    const req = makeRequest("http://localhost:3000/api/set-locale?locale=en&redirect=https://evil.com");
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/");
  });
});
