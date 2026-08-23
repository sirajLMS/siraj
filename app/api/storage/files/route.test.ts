import { describe, expect, mock, test } from "bun:test";

// Suppress logger output during tests
const noop = () => {};
await mock.module("@/backend/lib/logger", () => ({
  logger: { log: noop, info: noop, warn: noop, error: noop, debug: noop },
  default: { log: noop, info: noop, warn: noop, error: noop, debug: noop },
}));

mock.module("next/server", () => {
  class MockNextResponse extends Response {
    static json(body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      return new MockNextResponse(JSON.stringify(body), {
        status: init?.status ?? 200,
        headers: { "content-type": "application/json", ...init?.headers },
      });
    }
  }
  class MockNextRequest {
    url: string;
    method: string;
    headers: Headers;
    cookies: { get(name: string): { value: string } | undefined };
    constructor(input: string, init?: { method?: string; headers?: HeadersInit }) {
      this.url = input;
      this.method = init?.method ?? "GET";
      this.headers = new Headers(init?.headers);
      this.cookies = { get: () => undefined };
    }
  }
  return {
    NextResponse: MockNextResponse,
    NextRequest: MockNextRequest,
  };
});

const { NextRequest: MockNextRequest } = await import("next/server");

async function importRoute() {
  return import("./[[...path]]/route") as Promise<{
    GET: (
      request: InstanceType<typeof MockNextRequest>,
      context: { params: Promise<{ path?: string[] }> }
    ) => Promise<Response>;
  }>;
}

function makeRequest(urlPath: string) {
  return new MockNextRequest(`http://localhost:3000${urlPath}`, { method: "GET" });
}

describe("GET /api/storage/files/[[...path]] - Security & Path Traversal Checks", () => {
  test("returns 400 when path parameter is missing", async () => {
    const { GET } = await importRoute();
    const response = await GET(makeRequest("/api/storage/files"), {
      params: Promise.resolve({ path: undefined }),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body).toHaveProperty("error");
  });

  test("returns 400 on path traversal attempt using relative tokens in public avatar path", async () => {
    const { GET } = await importRoute();
    const response = await GET(makeRequest("/api/storage/files/avatars/../invoices/secret.pdf"), {
      params: Promise.resolve({ path: ["avatars", "..", "invoices", "secret.pdf"] }),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body).toHaveProperty("error");
  });

  test("returns 400 on path traversal attempt in public prefix", async () => {
    const { GET } = await importRoute();
    const response = await GET(makeRequest("/api/storage/files/public/../private/data.json"), {
      params: Promise.resolve({ path: ["public", "..", "private", "data.json"] }),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body).toHaveProperty("error");
  });

  test("returns 400 on path traversal attempt containing backslashes", async () => {
    const { GET } = await importRoute();
    const response = await GET(makeRequest("/api/storage/files/avatars\\secret.pdf"), {
      params: Promise.resolve({ path: ["avatars\\secret.pdf"] }),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body).toHaveProperty("error");
  });

  test("returns 401 when accessing non-public path without authentication", async () => {
    const { GET } = await importRoute();
    const response = await GET(makeRequest("/api/storage/files/invoices/inv_123.pdf"), {
      params: Promise.resolve({ path: ["invoices", "inv_123.pdf"] }),
    });

    expect(response.status).toBe(401);
    const body = (await response.json()) as { error: string };
    expect(body).toHaveProperty("error");
  });
});
