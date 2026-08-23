import { describe, expect, test } from "bun:test";
import { StorageService } from "@/backend/services/storage/storage.service";

describe("StorageService.validatePath", () => {
  test("returns true for valid safe relative paths", () => {
    expect(StorageService.validatePath("avatars/students/01.png")).toBe(true);
    expect(StorageService.validatePath("public/documents/readme.pdf")).toBe(true);
    expect(StorageService.validatePath("invoices/inv_1001.pdf")).toBe(true);
  });

  test("returns false for path traversal with relative parent directory (..)", () => {
    expect(StorageService.validatePath("avatars/../invoices/123.pdf")).toBe(false);
    expect(StorageService.validatePath("public/../private/secret.txt")).toBe(false);
    expect(StorageService.validatePath("../etc/passwd")).toBe(false);
    expect(StorageService.validatePath("a/b/../../c")).toBe(false);
  });

  test("returns false for absolute paths", () => {
    expect(StorageService.validatePath("/etc/passwd")).toBe(false);
    expect(StorageService.validatePath("~/secret")).toBe(false);
  });

  test("returns false for paths containing backslashes", () => {
    expect(StorageService.validatePath("avatars\\secret.pdf")).toBe(false);
    expect(StorageService.validatePath("..\\private\\data.json")).toBe(false);
  });
});
