import { describe, expect, test } from "bun:test";
import { testLogger } from "@/shared/lib/testlogger";
import { VercelAdapter } from "./adapter";

describe("Vercel Blob Storage Integration Test", () => {
  const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN;

  test("Uploads, verifies existence, gets info, and deletes a file from Vercel Blob", async () => {
    if (!hasToken) {
      testLogger.warn("⚠️  Skipping Vercel Blob integration test: BLOB_READ_WRITE_TOKEN is not set.");
      return;
    }

    const adapter = new VercelAdapter();
    const testFilePath = `public/test-integration-${Date.now()}.txt`;
    const fileContent = "Hello Vercel Blob Integration Test!";
    const buffer = Buffer.from(fileContent);
    const contentType = "text/plain";

    // 1. Upload File
    testLogger.log("Uploading test file to Vercel Blob...");
    const uploadResult = await adapter.uploadFile(testFilePath, contentType, buffer);
    if (!uploadResult.success) {
      testLogger.error("Upload failed with message:", uploadResult.message);
    }
    expect(uploadResult.success).toBe(true);
    expect(uploadResult.data?.url).toBeDefined();
    testLogger.log("Uploaded successfully. URL:", uploadResult.data?.url);

    // 2. Check File Existence
    testLogger.log("Checking if file exists...");
    const exists = await adapter.fileExists(testFilePath);
    expect(exists).toBe(true);

    // 3. Get File Info
    testLogger.log("Retrieving file info...");
    const fileInfo = await adapter.fileInfoByPath(testFilePath);
    expect(fileInfo).not.toBeNull();
    expect(fileInfo?.path).toBe(testFilePath);
    expect(Number(fileInfo?.size)).toBe(buffer.length);
    expect(fileInfo?.url).toBe(uploadResult.data?.url);

    // 4. Delete File
    testLogger.log("Deleting file...");
    const deleteResult = await adapter.deleteFile(testFilePath);
    expect(deleteResult.success).toBe(true);

    // 5. Verify File is Deleted
    testLogger.log("Verifying deletion...");
    const existsAfterDelete = await adapter.fileExists(testFilePath);
    expect(existsAfterDelete).toBe(false);
    testLogger.log("✅ Vercel Blob integration test passed!");
  });
});
