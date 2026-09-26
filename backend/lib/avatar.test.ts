import { describe, expect, test } from "bun:test";
import { resolveClassAvatarUrl } from "@/backend/lib/avatar";

describe("resolveClassAvatarUrl", () => {
  test("returns recurring override when set", () => {
    expect(resolveClassAvatarUrl("https://example.com/recurring.png", "https://example.com/subject.png")).toBe(
      "https://example.com/recurring.png"
    );
  });

  test("falls back to subject avatar when recurring is empty", () => {
    expect(resolveClassAvatarUrl(null, "https://example.com/subject.png")).toBe("https://example.com/subject.png");
    expect(resolveClassAvatarUrl("", "https://example.com/subject.png")).toBe("https://example.com/subject.png");
  });

  test("returns null when both are missing", () => {
    expect(resolveClassAvatarUrl(null, null)).toBeNull();
    expect(resolveClassAvatarUrl(undefined, undefined)).toBeNull();
  });

  test("allows safe relative paths starting with /", () => {
    expect(resolveClassAvatarUrl("/storage/files/recurring.png", "/images/subject.png")).toBe(
      "/storage/files/recurring.png"
    );
    expect(resolveClassAvatarUrl(null, "/images/subject.png")).toBe("/images/subject.png");
  });

  test("rejects unsafe scheme in recurring avatar and falls back to safe subject avatar", () => {
    expect(resolveClassAvatarUrl("javascript:alert(1)", "https://example.com/subject.png")).toBe(
      "https://example.com/subject.png"
    );
    expect(resolveClassAvatarUrl("data:text/html,<script>alert(1)</script>", "/images/subject.png")).toBe(
      "/images/subject.png"
    );
    expect(resolveClassAvatarUrl("//evil.com/avatar.png", "https://example.com/subject.png")).toBe(
      "https://example.com/subject.png"
    );
  });

  test("returns null when both recurring and subject avatars are unsafe", () => {
    expect(resolveClassAvatarUrl("javascript:alert(1)", "data:text/html,x")).toBeNull();
    expect(resolveClassAvatarUrl("//evil.com/a.png", "vbscript:msgbox(1)")).toBeNull();
    expect(resolveClassAvatarUrl("/\\evil.com", "javascript:void(0)")).toBeNull();
  });
});
