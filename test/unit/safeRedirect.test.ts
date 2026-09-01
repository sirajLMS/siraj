import { describe, expect, it } from "vitest";
import {
  DEFAULT_POST_LOGIN_PATH,
  buildLoginHref,
  isRelativeSafePath,
  isSafeRedirect,
} from "@/frontend/common/lib/safeRedirect";

describe("safeRedirect", () => {
  describe("isRelativeSafePath", () => {
    it("allows valid relative paths", () => {
      expect(isRelativeSafePath("/dashboard")).toBe(true);
      expect(isRelativeSafePath("/classes/101?query=1")).toBe(true);
      expect(isRelativeSafePath("/users/profile#settings")).toBe(true);
    });

    it("rejects absolute URLs", () => {
      expect(isRelativeSafePath("http://evil.com")).toBe(false);
      expect(isRelativeSafePath("https://evil.com")).toBe(false);
      expect(isRelativeSafePath("javascript:alert(1)")).toBe(false);
    });

    it("rejects protocol-relative double slash URLs", () => {
      expect(isRelativeSafePath("//evil.com")).toBe(false);
      expect(isRelativeSafePath("//evil.com/path")).toBe(false);
    });

    it("rejects backslash variants", () => {
      expect(isRelativeSafePath("/\\evil.com")).toBe(false);
      expect(isRelativeSafePath("/\\/evil.com")).toBe(false);
    });

    it("rejects control character and whitespace open redirect bypasses", () => {
      expect(isRelativeSafePath("/\t/evil.com")).toBe(false);
      expect(isRelativeSafePath("/\n/evil.com")).toBe(false);
      expect(isRelativeSafePath("/\r/evil.com")).toBe(false);
      expect(isRelativeSafePath("/ /evil.com")).toBe(false);
      expect(isRelativeSafePath("/\\t/evil.com")).toBe(false);
      expect(isRelativeSafePath("/path\twith\ttab")).toBe(false);
    });
  });

  describe("isSafeRedirect", () => {
    it("returns original path for valid relative path", () => {
      expect(isSafeRedirect("/dashboard")).toBe("/dashboard");
      expect(isSafeRedirect("/accounting/invoices")).toBe("/accounting/invoices");
    });

    it("returns default path for null/undefined or unsafe input", () => {
      expect(isSafeRedirect(null)).toBe(DEFAULT_POST_LOGIN_PATH);
      expect(isSafeRedirect("")).toBe(DEFAULT_POST_LOGIN_PATH);
      expect(isSafeRedirect("//evil.com")).toBe(DEFAULT_POST_LOGIN_PATH);
      expect(isSafeRedirect("/\t/evil.com")).toBe(DEFAULT_POST_LOGIN_PATH);
      expect(isSafeRedirect("https://evil.com")).toBe(DEFAULT_POST_LOGIN_PATH);
    });
  });

  describe("buildLoginHref", () => {
    it("builds login redirect URL for safe path", () => {
      expect(buildLoginHref("/dashboard")).toBe("/login?redirect=%2Fdashboard");
    });

    it("returns base login path for unsafe path or login path itself", () => {
      expect(buildLoginHref("//evil.com")).toBe("/login");
      expect(buildLoginHref("/\t/evil.com")).toBe("/login");
      expect(buildLoginHref("/login")).toBe("/login");
    });
  });
});
