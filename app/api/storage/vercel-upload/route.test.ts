import { describe, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";

// Mock dependencies
mock.module("@/backend/lib", () => ({
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

mock.module("@/backend/services", () => ({
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

mock.module("@/backend/db", () => ({
  SignedUrlRepository: {
    getSignedUrlById: async () => ({
      used: false,
      expiresAt: new Date(Date.now() + 3600000),
      filePath: "test/file.png",
    }),
  },
}));

mock.module("@vercel/blob/client", () => ({
  handleUpload: async () => new Response(JSON.stringify({ type: "blob.generate-client-token" }), { status: 200 }),
}));

async function importRoute() {
  return import("./route");
}

describe("POST /api/storage/vercel-upload Authentication", () => {
  test("returns 401 when no auth header or cookies are provided", async () => {
    const { POST } = await importRoute();
    const req = new NextRequest("http://localhost:3000/api/storage/vercel-upload", {
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Authentication required" });
  });

  test("authenticates via access_token cookie when Authorization header is absent", async () => {
    const { POST } = await importRoute();
    const req = new NextRequest("http://localhost:3000/api/storage/vercel-upload", {
      method: "POST",
      headers: {
        cookie: "access_token=valid-access-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        type: "blob.generate-client-token",
        payload: {
          pathname: "test/file.png",
          clientPayload: JSON.stringify({
            sessionId: "valid-session-id",
            fileSize: 100,
            contentType: "image/png",
          }),
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).not.toBe(401);
  });

  test("authenticates via session_id cookie fallback when access_token is absent/expired", async () => {
    const { POST } = await importRoute();
    const req = new NextRequest("http://localhost:3000/api/storage/vercel-upload", {
      method: "POST",
      headers: {
        cookie: "session_id=valid-session-id",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        type: "blob.generate-client-token",
        payload: {
          pathname: "test/file.png",
          clientPayload: JSON.stringify({
            sessionId: "valid-session-id",
            fileSize: 100,
            contentType: "image/png",
          }),
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).not.toBe(401);
  });

  test("authenticates via Authorization header when present", async () => {
    const { POST } = await importRoute();
    const req = new NextRequest("http://localhost:3000/api/storage/vercel-upload", {
      method: "POST",
      headers: {
        authorization: "Bearer valid-access-token",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        type: "blob.generate-client-token",
        payload: {
          pathname: "test/file.png",
          clientPayload: JSON.stringify({
            sessionId: "valid-session-id",
            fileSize: 100,
            contentType: "image/png",
          }),
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).not.toBe(401);
  });
});
