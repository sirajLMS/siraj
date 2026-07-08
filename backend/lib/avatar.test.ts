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
});
