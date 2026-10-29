import { describe, expect, test } from "bun:test";
import { avatarInitials } from "./avatar";

describe("avatarInitials", () => {
  test("returns empty string for empty or whitespace-only input", () => {
    expect(avatarInitials("")).toBe("");
    expect(avatarInitials("   ")).toBe("");
    expect(avatarInitials("\t\n ")).toBe("");
  });

  test("returns first character for a single word name", () => {
    expect(avatarInitials("John")).toBe("J");
    expect(avatarInitials("Alice")).toBe("A");
  });

  test("returns first two initials for multi-word names", () => {
    expect(avatarInitials("John Doe")).toBe("JD");
    expect(avatarInitials("Alice Bob Charlie")).toBe("AB");
  });

  test("handles leading, trailing, and multiple consecutive spaces", () => {
    expect(avatarInitials("  John   Doe  ")).toBe("JD");
    expect(avatarInitials("  Alice  ")).toBe("A");
  });

  test("handles special characters and non-Latin names", () => {
    expect(avatarInitials("محمد علي")).toBe("مع");
    expect(avatarInitials("John-Paul Smith")).toBe("JS");
  });
});
