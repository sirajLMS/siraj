import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";
import { allocateTestPort, getTestApiUrl, releaseAllocatedTestPort, setTestPort } from "@/test/helpers";

const checkRateLimitMock = mock(async () => ({
  success: true,
  limit: 10,
  remaining: 9,
  reset: Date.now() + 600_000,
}));

await mock.module("@/backend/lib/ratelimit", () => ({
  checkRateLimit: checkRateLimitMock,
  exportRateLimiter: {},
  storageUploadRateLimiter: {},
  apiRateLimiter: {},
  graphqlRateLimiter: {},
  authRateLimiter: {},
  clientLogsRateLimiter: {},
  getClientIdentifier: (request: Request) => request.headers.get("x-forwarded-for") ?? "test-ip",
  rateLimitLogId: (id: string) => id,
}));

// Mock dependencies
await mock.module("@/backend/lib", () => ({
  extractTokenFromHeader: (header: string | null) => {
    if (header?.startsWith("Bearer ")) return header.slice(7);
    return null;
  },
  getStringEnv: (_name: string, fallback?: string) => fallback ?? "test-env-value",
  logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
  verifyToken: async (token: string) => {
    if (token === "valid-access-token") {
      return { type: "access", userId: "user-123" };
    }
    return null;
  },
  resolveLocalStoragePath: (filePath: string) => `/tmp/test-storage/${filePath}`,
  resolvePublicStoragePath: (filePath: string) => `/tmp/test-storage/${filePath}`,
  getServerUserContext: async () => ({ userId: "user-123", context: {} }),
  rateLimitLogId: (id: string) => id,
}));

await mock.module("@/backend/services", () => ({
  SessionService: {
    validateSession: async (sessionId: string) => {
      if (sessionId === "valid-session-id") {
        return { userId: "user-123" };
      }
      return null;
    },
  },
  StorageService: {
    validateUpload: () => null,
    checkDirectoryUploadPermissions: async () => null,
    validateSignedUrlSession: async () => null,
    claimSignedUrl: async () => {},
    createFile: async () => {},
  },
}));

await mock.module("@/backend/lib/storage", () => ({
  ALLOWED_MIME_TYPES: ["image/png"],
  isImageContentType: (contentType: string) => contentType.startsWith("image/"),
  verifyImageMagicBytes: () => true,
}));

await mock.module("@/backend/storage/disk/vercel/operations", () => ({
  isPublicStoragePath: (filePath: string) => filePath === "public" || filePath.startsWith("public/"),
  resolveBlobAccess: (access: "public" | "private", _filePath: string) => access,
}));

const delMock = mock(async (_url: string, _options?: { token?: string }) => {});
await mock.module("@vercel/blob", () => ({
  del: delMock,
}));

const uploadCompletedPayload: {
  value: null | { blob: { url: string; pathname: string }; tokenPayload: string | null };
} = { value: null };

await mock.module("@vercel/blob/client", () => ({
  handleUpload: async (options: {
    onUploadCompleted?: (body: {
      blob: { url: string; pathname: string };
      tokenPayload?: string | null;
    }) => Promise<void>;
  }) => {
    if (uploadCompletedPayload.value && options.onUploadCompleted) {
      await options.onUploadCompleted(uploadCompletedPayload.value);
    }
    return new Response(JSON.stringify({ type: "blob.generate-client-token" }), { status: 200 });
  },
}));

// Stand-in for the global fetch the route uses for the magic-byte range
// request (sent with a Range header) and the anonymous readability probe
// (sent without any headers).
const originalFetch = globalThis.fetch;
const magicByteFetchMock = mock(
  async (..._args: Parameters<typeof fetch>) => new Response(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), { status: 206 })
);
const probeFetchMock = mock(async (..._args: Parameters<typeof fetch>) => new Response(null, { status: 403 }));
globalThis.fetch = Object.assign(
  async (input: Parameters<typeof originalFetch>[0], init?: Parameters<typeof originalFetch>[1]) => {
    const headers = init?.headers;
    const hasRangeHeader = !!headers && typeof headers === "object" && !Array.isArray(headers) && "Range" in headers;
    return hasRangeHeader ? magicByteFetchMock(input, init) : probeFetchMock(input, init);
  },
  { preconnect: originalFetch.preconnect }
);

await mock.module("@/backend/db", () => ({
  SignedUrlRepository: {
    getSignedUrlById: async () => ({
      used: false,
      expiresAt: new Date(Date.now() + 3600000),
      filePath: "test/file.png",
    }),
  },
}));

beforeAll(async () => {
  const port = await allocateTestPort();
  setTestPort(port);
});

afterAll(async () => {
  globalThis.fetch = originalFetch;
  await releaseAllocatedTestPort();
});

function getUploadUrl(): string {
  return getTestApiUrl("/api/storage/vercel-upload");
}

const AUTHENTICATED_UPLOAD_BODY = {
  type: "blob.generate-client-token",
  payload: {
    pathname: "test/file.png",
    clientPayload: JSON.stringify({
      sessionId: "valid-session-id",
      fileSize: 100,
      contentType: "image/png",
    }),
  },
};

async function importRoute() {
  return import("./route");
}

function createAuthenticatedUploadRequest(headers: Record<string, string>) {
  return new NextRequest(getUploadUrl(), {
    method: "POST",
    headers: {
      ...headers,
      "content-type": "application/json",
    },
    body: JSON.stringify(AUTHENTICATED_UPLOAD_BODY),
  });
}

async function expectAuthenticatedPost(headers: Record<string, string>) {
  const { POST } = await importRoute();
  const res = await POST(createAuthenticatedUploadRequest(headers));
  expect(res.status).not.toBe(401);
}

async function postUploadWithPathname(pathname: string) {
  const { POST } = await importRoute();
  const body = {
    type: "blob.generate-client-token",
    payload: {
      pathname,
      clientPayload: JSON.stringify({
        sessionId: "valid-session-id",
        fileSize: 100,
        contentType: "image/png",
      }),
    },
  };
  const req = new NextRequest(getUploadUrl(), {
    method: "POST",
    headers: {
      authorization: "Bearer valid-access-token",
      "accept-language": "en",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return await POST(req);
}

function setCompletedBlob(pathname: string) {
  uploadCompletedPayload.value = {
    blob: { url: `https://store.example.com/${pathname}`, pathname },
    tokenPayload: JSON.stringify({ sessionId: "valid-session-id", contentType: "image/png" }),
  };
}

describe("POST /api/storage/vercel-upload Authentication", () => {
  test("returns 401 when no auth header or cookies are provided", async () => {
    const { POST } = await importRoute();
    const req = new NextRequest(getUploadUrl(), {
      method: "POST",
      headers: { "accept-language": "en" },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Authentication required" });
  });

  test("authenticates via access_token cookie when Authorization header is absent", async () => {
    await expectAuthenticatedPost({ cookie: "access_token=valid-access-token" });
  });

  test("authenticates via session_id cookie fallback when access_token is absent/expired", async () => {
    await expectAuthenticatedPost({ cookie: "session_id=valid-session-id" });
  });

  test("authenticates via Authorization header when present", async () => {
    await expectAuthenticatedPost({ authorization: "Bearer valid-access-token" });
  });

  test("returns 429 with the localized message when the storage upload rate limit is exceeded", async () => {
    checkRateLimitMock.mockResolvedValueOnce({ success: false, limit: 10, remaining: 0, reset: Date.now() + 60_000 });

    const { POST } = await importRoute();
    const res = await POST(
      createAuthenticatedUploadRequest({ authorization: "Bearer valid-access-token", "accept-language": "en" })
    );

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body).toEqual({ error: "Too many requests. Please try again later." });
  });
});

describe("POST /api/storage/vercel-upload onUploadCompleted enforcement", () => {
  test("deletes a non-public blob that is anonymously readable", async () => {
    delMock.mockClear();
    magicByteFetchMock.mockClear();
    probeFetchMock.mockClear();
    // Valid magic bytes, but the anonymous probe returns 200.
    probeFetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }));

    setCompletedBlob("private/file.png");
    await postUploadWithPathname("private/file.png");

    expect(delMock).toHaveBeenCalledTimes(1);
    expect(delMock.mock.calls[0][0]).toBe("https://store.example.com/private/file.png");
  });

  test("deletes a non-public image blob when the magic-byte probe fails", async () => {
    delMock.mockClear();
    magicByteFetchMock.mockClear();
    probeFetchMock.mockClear();
    magicByteFetchMock.mockResolvedValueOnce(new Response(null, { status: 403 }));

    setCompletedBlob("private/file.png");
    await postUploadWithPathname("private/file.png");

    expect(delMock).toHaveBeenCalledTimes(1);
  });

  test("keeps a public blob lenient when magic-byte verification is unavailable", async () => {
    delMock.mockClear();
    magicByteFetchMock.mockClear();
    probeFetchMock.mockClear();
    magicByteFetchMock.mockResolvedValueOnce(new Response(null, { status: 403 }));

    setCompletedBlob("public/file.png");
    await postUploadWithPathname("public/file.png");

    expect(delMock).not.toHaveBeenCalled();
  });
});
