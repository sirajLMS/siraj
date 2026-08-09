import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";
import {
  allocateTestPort,
  getTestApiUrl,
  releaseAllocatedTestPort,
  setTestPort,
} from "@/frontend/common/graphql/test/testPort";

// Mock dependencies
await mock.module("@/backend/lib", () => ({
  extractTokenFromHeader: (header: string | null) => {
    if (header?.startsWith("Bearer ")) return header.slice(7);
    return null;
  },
  logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
  verifyToken: async (token: string) => {
    if (token === "valid-access-token") {
      return { type: "access", userId: "user-123" };
    }
    return null;
  },
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
  },
}));

await mock.module("@/backend/db", () => ({
  SignedUrlRepository: {
    getSignedUrlById: async () => ({
      used: false,
      expiresAt: new Date(Date.now() + 3600000),
      filePath: "test/file.png",
    }),
  },
}));

await mock.module("@vercel/blob/client", () => ({
  handleUpload: async () => new Response(JSON.stringify({ type: "blob.generate-client-token" }), { status: 200 }),
}));

beforeAll(async () => {
  const port = await allocateTestPort();
  setTestPort(port);
});

afterAll(async () => {
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

describe("POST /api/storage/vercel-upload Authentication", () => {
  test("returns 401 when no auth header or cookies are provided", async () => {
    const { POST } = await importRoute();
    const req = new NextRequest(getUploadUrl(), {
      method: "POST",
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
});
