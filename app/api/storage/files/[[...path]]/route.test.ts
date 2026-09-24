import { beforeEach, describe, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";

const checkRateLimitMock = mock(async () => ({
  success: true,
  limit: 200,
  remaining: 199,
  reset: Date.now() + 60_000,
}));

const getClientIdentifierMock = mock((_req: Request) => "127.0.0.1");

await mock.module("@/backend/lib/ratelimit", () => ({
  checkRateLimit: checkRateLimitMock,
  getClientIdentifier: getClientIdentifierMock,
  apiRateLimiter: {},
}));

const validatePathMock = mock((_path: string) => true);

await mock.module("@/backend/services", () => ({
  SessionService: {},
  StorageService: {
    validatePath: validatePathMock,
    checkFileAccess: mock(async () => null),
  },
}));

await mock.module("@/backend/lib", () => ({
  extractTokenFromHeader: mock(() => null),
  logger: { log: () => {}, info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
  resolveLocalStoragePath: mock((p: string) => `/tmp/storage/${p}`),
  resolvePublicStoragePath: mock((p: string) => `/tmp/public/${p}`),
  verifyToken: mock(async () => null),
}));

async function importRoute() {
  return import("./route");
}

function makeFileRequest(path = "public/test.png"): NextRequest {
  const headers = new Headers();
  headers.set("accept-language", "en");
  return new NextRequest(`http://localhost:3000/api/storage/files/${path}`, { method: "GET", headers });
}

beforeEach(() => {
  checkRateLimitMock.mockClear();
  getClientIdentifierMock.mockClear();
  validatePathMock.mockClear();

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
    const response = await GET(makeFileRequest(), {
      params: Promise.resolve({ path: ["public", "test.png"] }),
    });

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "Too many requests. Please try again later." });
    expect(checkRateLimitMock).toHaveBeenCalledTimes(1);
  });

  test("calls checkRateLimit on request and proceeds when rate limit is respected", async () => {
    const { GET } = await importRoute();
    const response = await GET(makeFileRequest("invalid/path"), {
      params: Promise.resolve({ path: ["invalid", "path"] }),
    });

    expect(checkRateLimitMock).toHaveBeenCalledTimes(1);
    // Should get past rate limit check and fail at auth or path validation
    expect(response.status).not.toBe(429);
  });
});
