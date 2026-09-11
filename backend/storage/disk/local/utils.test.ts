import { describe, expect, it } from "bun:test";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { calculateFileHash, cleanLocalPath, getAbsolutePath } from "@/backend/storage/disk/local/utils";
import { StorageValidationError } from "@/backend/storage/disk/storage.service.interface";

async function createTestFileAndComputeHash(
  filename: string,
  content: Buffer
): Promise<{ computedHash: string; expectedHash: string }> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "hash-test-"));
  const testFile = path.join(tempDir, filename);

  try {
    await fs.writeFile(testFile, content);
    const expectedHash = crypto.createHash("sha256").update(content).digest("base64");
    const computedHash = await calculateFileHash(testFile);
    return { computedHash, expectedHash };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

describe("local storage utils", () => {
  describe("cleanLocalPath", () => {
    it("should remove leading and trailing slashes", () => {
      expect(cleanLocalPath("/foo/bar/")).toBe("foo/bar");
      expect(cleanLocalPath("foo/bar/")).toBe("foo/bar");
      expect(cleanLocalPath("foo/bar")).toBe("foo/bar");
    });

    it("should return empty string for empty input", () => {
      expect(cleanLocalPath("")).toBe("");
    });
  });

  describe("getAbsolutePath", () => {
    it("should resolve valid paths inside base directory", () => {
      const basePath = path.resolve("test-base-storage");
      expect(getAbsolutePath(basePath, "file.txt")).toBe(path.join(basePath, "file.txt"));
      expect(getAbsolutePath(basePath, "sub/file.txt")).toBe(path.join(basePath, "sub/file.txt"));
    });

    it("should throw StorageValidationError on path traversal", () => {
      const basePath = path.resolve("test-base-storage");
      expect(() => getAbsolutePath(basePath, "../outside.txt")).toThrow(StorageValidationError);
      expect(() => getAbsolutePath(basePath, "sub/../../outside.txt")).toThrow(StorageValidationError);
    });
  });

  describe("calculateFileHash", () => {
    it("should correctly compute base64 sha256 hash using streams for small files", async () => {
      const content = Buffer.from("Hello World Security Test");
      const { computedHash, expectedHash } = await createTestFileAndComputeHash("small.txt", content);

      expect(computedHash).toBe(expectedHash);
    });

    it("should correctly compute base64 sha256 hash using streams for multi-chunk files", async () => {
      // Create 256KB buffer to exceed standard stream chunk size (64KB)
      const content = Buffer.alloc(256 * 1024, "a");
      const { computedHash, expectedHash } = await createTestFileAndComputeHash("large.txt", content);

      expect(computedHash).toBe(expectedHash);
    });

    it("should reject when file does not exist", async () => {
      const nonExistentFile = path.join(os.tmpdir(), "non-existent-file-12345.txt");

      return expect(calculateFileHash(nonExistentFile)).rejects.toThrow();
    });
  });
});
