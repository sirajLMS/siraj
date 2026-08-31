import { describe, expect, it } from "bun:test";
import { buildLoginHref, DEFAULT_POST_LOGIN_PATH, isRelativeSafePath, isSafeRedirect } from "./safeRedirect";

describe("safeRedirect", () => {
  describe("isRelativeSafePath", () => {
    it("accepts valid relative paths", () => {
      expect(isRelativeSafePath("/dashboard")).toBe(true);
      expect(isRelativeSafePath("/users/123?tab=settings")).toBe(true);
      expect(isRelativeSafePath("/profile#overview")).toBe(true);
      expect(isRelativeSafePath("/")).toBe(true);
    });

    it("rejects protocol-relative URLs starting with //", () => {
      expect(isRelativeSafePath("//evil.com")).toBe(false);
      expect(isRelativeSafePath("//evil.com/phishing")).toBe(false);
      expect(isRelativeSafePath("///evil.com")).toBe(false);
    });

    it("rejects backslash open redirect attempts starting with /\\", () => {
      expect(isRelativeSafePath("/\\evil.com")).toBe(false);
      expect(isRelativeSafePath("/\\/evil.com")).toBe(false);
      expect(isRelativeSafePath("/\\\\evil.com")).toBe(false);
    });

    it("rejects absolute URLs and paths without leading slash", () => {
      expect(isRelativeSafePath("https://evil.com")).toBe(false);
      expect(isRelativeSafePath("http://evil.com")).toBe(false);
      expect(isRelativeSafePath("javascript:alert(1)")).toBe(false);
      expect(isRelativeSafePath("dashboard")).toBe(false);
    });
  });

  describe("isSafeRedirect", () => {
    it("returns original path when safe", () => {
      expect(isSafeRedirect("/schedule")).toBe("/schedule");
      expect(isSafeRedirect("/students?page=2")).toBe("/students?page=2");
    });

    it("returns DEFAULT_POST_LOGIN_PATH when unsafe or null", () => {
      expect(isSafeRedirect(null)).toBe(DEFAULT_POST_LOGIN_PATH);
      expect(isSafeRedirect("")).toBe(DEFAULT_POST_LOGIN_PATH);
      expect(isSafeRedirect("//evil.com")).toBe(DEFAULT_POST_LOGIN_PATH);
      expect(isSafeRedirect("/\\evil.com")).toBe(DEFAULT_POST_LOGIN_PATH);
      expect(isSafeRedirect("https://evil.com")).toBe(DEFAULT_POST_LOGIN_PATH);
    });
  });

  describe("buildLoginHref", () => {
    it("builds login href with redirect parameter for safe relative paths", () => {
      expect(buildLoginHref("/dashboard")).toBe("/login?redirect=%2Fdashboard");
      expect(buildLoginHref("/schedule?view=week")).toBe("/login?redirect=%2Fschedule%3Fview%3Dweek");
    });

    it("returns bare /login for unsafe paths or recursive login paths", () => {
      expect(buildLoginHref("//evil.com")).toBe("/login");
      expect(buildLoginHref("/\\evil.com")).toBe("/login");
      expect(buildLoginHref("/login")).toBe("/login");
      expect(buildLoginHref("/ar/login")).toBe("/login");
    });
  });
});
