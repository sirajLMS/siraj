import { describe, expect, test } from "bun:test";
import { isRelativeSafePath, isSafeRedirect } from "@/frontend/common/lib/safeRedirect";

describe("Safe Redirect Validation", () => {
  describe("isRelativeSafePath", () => {
    test("accepts valid relative paths", () => {
      expect(isRelativeSafePath("/dashboard")).toBe(true);
      expect(isRelativeSafePath("/settings/profile?nav=true")).toBe(true);
      expect(isRelativeSafePath("/foo/bar#section")).toBe(true);
    });

    test("rejects protocol-relative URLs", () => {
      expect(isRelativeSafePath("//evil.com")).toBe(false);
      expect(isRelativeSafePath("//google.com/path")).toBe(false);
    });

    test("rejects backslash open redirect bypass payloads", () => {
      expect(isRelativeSafePath("/\\evil.com")).toBe(false);
      expect(isRelativeSafePath("/\\\\evil.com")).toBe(false);
      expect(isRelativeSafePath("/\\/evil.com")).toBe(false);
    });

    test("rejects absolute URLs or non-leading slash strings", () => {
      expect(isRelativeSafePath("https://evil.com")).toBe(false);
      expect(isRelativeSafePath("http://evil.com")).toBe(false);
      expect(isRelativeSafePath("dashboard")).toBe(false);
    });
  });

  describe("isSafeRedirect", () => {
    test("returns path if safe", () => {
      expect(isSafeRedirect("/dashboard")).toBe("/dashboard");
    });

    test("falls back to /dashboard when given unsafe redirect payloads", () => {
      expect(isSafeRedirect("/\\evil.com")).toBe("/dashboard");
      expect(isSafeRedirect("//evil.com")).toBe("/dashboard");
      expect(isSafeRedirect("https://evil.com")).toBe("/dashboard");
      expect(isSafeRedirect(null)).toBe("/dashboard");
    });
  });
});
