import { beforeEach, describe, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";

const checkRateLimitMock = mock(async () => ({
  success: true,
  limit: 200,
  remaining: 199,
  reset: Date.now() + 60_000,
}));

const getClientIdentifierMock = mock(() => "127.0.0.1");

await mock.module("@/backend/lib/ratelimit", () => ({
  checkRateLimit: checkRateLimitMock,
  getClientIdentifier: getClientIdentifierMock,
  apiRateLimiter: {},
  rateLimitLogId: (id: string) => id,
}));

await mock.module("@/backend/lib", () => ({
  extractTokenFromHeader: () => null,
  verifyToken: async () => null,
  logger: { warn: () => {}, error: () => {}, info: () => {}, debug: () => {} },
  resolveLocalStoragePath: (p: string) => p,
  resolvePublicStoragePath: (p: string) => p,
}));

await mock.module("@/backend/services", () => ({
  SessionService: { validateSession: async () => null },
  StorageService: {
    validatePath: () => true,
    checkFileAccess: async () => null,
  },
}));

async function importRoute() {
  return import("./route");
}

function makeFileRequest(path = ""): NextRequest {
  const headers = new Headers();
  headers.set("accept-language", "en");
  return new NextRequest(`http://localhost:3000/api/storage/files/${path}`, { method: "GET", headers });
}

beforeEach(() => {
  checkRateLimitMock.mockClear();
  getClientIdentifierMock.mockClear();
  checkRateLimitMock.mockResolvedValue({
    success: true,
    limit: 200,
    remaining: 199,
    reset: Date.now() + 60_000,
  });
});

describe("GET /api/storage/files/[[...path]] rate limiting", () => {
  test("returns 429 when rate limit is exceeded", async () => {
    checkRateLimitMock.mockResolvedValueOnce({
      success: false,
      limit: 200,
      remaining: 0,
      reset: Date.now() + 60_000,
    });

    const { GET } = await importRoute();
    const response = await GET(makeFileRequest("public/test.png"), {
      params: Promise.resolve({ path: ["public", "test.png"] }),
    });

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "Too many requests. Please try again later." });
    expect(checkRateLimitMock).toHaveBeenCalledTimes(1);
  });

  test("allows request through when rate limit is not exceeded", async () => {
    const { GET } = await importRoute();
    const response = await GET(makeFileRequest(), {
      params: Promise.resolve({ path: [] }),
    });

    expect(checkRateLimitMock).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(400); // filePathRequired
    expect(await response.json()).toEqual({ error: "File path is required" });
  });
});
