import { describe, expect, test } from "bun:test";
import { StorageService } from "@/backend/services/storage/storage.service";

describe("StorageService.validatePath", () => {
  describe("valid paths", () => {
    test("allows standard relative file path", () => {
      expect(StorageService.validatePath("invoices/invoice-123.pdf")).toBe(true);
    });

    test("allows subdirectories with hyphens, underscores, dots, and spaces", () => {
      expect(StorageService.validatePath("public/avatars/user_profile (1).png")).toBe(true);
    });

    test("allows nested directory structure", () => {
      expect(StorageService.validatePath("documents/2026/09/report.pdf")).toBe(true);
    });
  });

  describe("invalid / malicious paths", () => {
    test("rejects directory traversal patterns (..)", () => {
      expect(StorageService.validatePath("../etc/passwd")).toBe(false);
      expect(StorageService.validatePath("invoices/../../secret.txt")).toBe(false);
    });

    test("rejects double slashes (//)", () => {
      expect(StorageService.validatePath("invoices//invoice.pdf")).toBe(false);
    });

    test("rejects leading slashes and backslashes", () => {
      expect(StorageService.validatePath("/etc/passwd")).toBe(false);
      expect(StorageService.validatePath("\\Windows\\System32")).toBe(false);
    });

    test("rejects null bytes", () => {
      expect(StorageService.validatePath("invoices/file\0.pdf")).toBe(false);
      expect(StorageService.validatePath("\0/secret")).toBe(false);
    });

    test("rejects empty or whitespace-only paths", () => {
      expect(StorageService.validatePath("")).toBe(false);
      expect(StorageService.validatePath("   ")).toBe(false);
    });

    test("rejects paths with invalid or control characters", () => {
      expect(StorageService.validatePath("invoices/file\x07.pdf")).toBe(false);
      expect(StorageService.validatePath("invoices/<script>.pdf")).toBe(false);
    });

    test("rejects path exceeding maximum allowed length", () => {
      const longPath = "a/".repeat(600); // 1200 chars > 1024
      expect(StorageService.validatePath(longPath)).toBe(false);
    });
  });
});
