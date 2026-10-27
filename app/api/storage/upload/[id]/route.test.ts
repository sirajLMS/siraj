import { describe, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";
import * as uploadRequestHelpers from "@/app/api/storage/upload/[id]/upload-request.helpers";
import { UploadStreamError } from "@/app/api/storage/upload/[id]/upload-stream.helpers";
import { StorageService } from "@/backend/services";

const checkRateLimitMock = mock(async () => ({
  success: true,
  limit: 10,
  remaining: 9,
  reset: Date.now() + 600_000,
}));

await mock.module("@/backend/lib/ratelimit", () => ({
  checkRateLimit: checkRateLimitMock,
  storageUploadRateLimiter: {},
  apiRateLimiter: {},
  rateLimitLogId: (id: string) => id,
  getClientIdentifier: () => "test-client",
}));

let mockStreamToFileImplementation: (stream: ReadableStream) => Promise<void> = async () => {};

await mock.module("@/app/api/storage/upload/[id]/upload-stream.helpers", () => ({
  UploadStreamError,
  streamToFile: async (stream: ReadableStream) => mockStreamToFileImplementation(stream),
}));

await mock.module("@/app/api/storage/upload/[id]/upload-request.helpers", () => ({
  ...uploadRequestHelpers,
  resolveUploadUserId: async () => "user-123",
}));

describe("PUT /api/storage/upload/[id] Security & Error Handling", () => {
  test("returns expected status and message for UploadStreamError", async () => {
    StorageService.claimSignedUrl = mock(async () => ({
      contentType: "image/png",
      fileSize: 100n,
      contentHash: "VALID_HASH",
      filePath: "avatars/user-123.png",
      uploadedByUserId: "user-123",
    })) as typeof StorageService.claimSignedUrl;

    mockStreamToFileImplementation = async () => {
      throw new UploadStreamError(400, "Invalid SHA-256 hash");
    };

    const { PUT } = await import("./route");

    const req = new NextRequest("http://localhost:3000/api/storage/upload/token-123", {
      method: "PUT",
      headers: {
        "content-type": "image/png",
        "content-length": "10",
        "content-md5": "VALID_HASH",
      },
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.close();
        },
      }),
    });

    const response = await PUT(req, { params: Promise.resolve({ id: "token-123" }) });
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body).toEqual({ error: "Invalid SHA-256 hash" });
  });

  test("returns 500 with generic error message and redacts internal error details on unexpected system error", async () => {
    StorageService.claimSignedUrl = mock(async () => ({
      contentType: "image/png",
      fileSize: 100n,
      contentHash: "VALID_HASH",
      filePath: "avatars/user-123.png",
      uploadedByUserId: "user-123",
    })) as typeof StorageService.claimSignedUrl;

    mockStreamToFileImplementation = async () => {
      throw new Error("EACCES: permission denied, open '/var/data/secret/file'");
    };

    const { PUT } = await import("./route");

    const req = new NextRequest("http://localhost:3000/api/storage/upload/token-123", {
      method: "PUT",
      headers: {
        "content-type": "image/png",
        "content-length": "10",
        "content-md5": "VALID_HASH",
      },
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1, 2, 3]));
          controller.close();
        },
      }),
    });

    const response = await PUT(req, { params: Promise.resolve({ id: "token-123" }) });
    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body).not.toHaveProperty("stack");
    expect(JSON.stringify(body)).not.toContain("EACCES");
    expect(JSON.stringify(body)).not.toContain("/var/data/secret/file");
    expect(body.error).toBeDefined();
  });
});
