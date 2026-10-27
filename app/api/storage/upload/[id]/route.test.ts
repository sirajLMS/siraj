import { afterAll, describe, expect, mock, test } from "bun:test";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NextRequest } from "next/server";
import * as uploadRequestHelpers from "@/app/api/storage/upload/[id]/upload-request.helpers";
import { UploadStreamError } from "@/app/api/storage/upload/[id]/upload-stream.helpers";
import { getServerTranslations } from "@/shared/locale";

const tErrors = getServerTranslations("en").errorsTranslations;

const testStorageDir = join(tmpdir(), "siraj-upload-route-test");

const claimSignedUrlMock = mock(async () => ({
  contentType: "image/png",
  fileSize: 100n,
  contentHash: "VALID_HASH",
  filePath: "avatars/user-123.png",
  uploadedByUserId: "user-123",
}));

const streamToFileMock = mock(async (_stream: ReadableStream) => {});

await mock.module("@/backend/lib/ratelimit", () => ({
  checkRateLimit: async () => ({ success: true, limit: 30, remaining: 29, reset: Date.now() + 60_000 }),
  storageUploadRateLimiter: {},
  apiRateLimiter: {},
  rateLimitLogId: (id: string) => id,
  getClientIdentifier: () => "test-client",
}));

await mock.module("@/app/api/storage/upload/[id]/upload-stream.helpers", () => ({
  UploadStreamError,
  streamToFile: (stream: ReadableStream) => streamToFileMock(stream),
}));

await mock.module("@/app/api/storage/upload/[id]/upload-request.helpers", () => ({
  ...uploadRequestHelpers,
  resolveUploadUserId: async () => "user-123",
}));

await mock.module("@/backend/lib", () => ({
  logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
  rateLimitLogId: (id: string) => id,
  resolveLocalStoragePath: (filePath: string) => join(testStorageDir, filePath),
}));

await mock.module("@/backend/services", () => ({
  StorageService: { claimSignedUrl: claimSignedUrlMock },
}));

const { PUT } = await import("./route");

afterAll(async () => {
  rmSync(testStorageDir, { recursive: true, force: true });
});

function createUploadRequest(): NextRequest {
  return new NextRequest("http://localhost:3000/api/storage/upload/token-123", {
    method: "PUT",
    headers: {
      "accept-language": "en",
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
}

describe("PUT /api/storage/upload/[id] error handling", () => {
  test("returns the UploadStreamError status and message for rejected streams", async () => {
    streamToFileMock.mockRejectedValueOnce(new UploadStreamError(400, tErrors.file.sha256HashMismatch));

    const response = await PUT(createUploadRequest(), { params: Promise.resolve({ id: "token-123" }) });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: tErrors.file.sha256HashMismatch });
  });

  test("returns 500 with a generic message that redacts internal error details on unexpected errors", async () => {
    streamToFileMock.mockRejectedValueOnce(new Error("EACCES: permission denied, open '/var/data/secret/file'"));

    const response = await PUT(createUploadRequest(), { params: Promise.resolve({ id: "token-123" }) });

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: tErrors.file.failedToWriteFile });
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain("EACCES");
    expect(serialized).not.toContain("/var/data/secret/file");
  });
});
