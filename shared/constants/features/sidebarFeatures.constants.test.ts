import { describe, expect, test } from "bun:test";
import { parseEnvConfigBoolean } from "@/shared/constants/features/sidebarFeatures.constants";

describe("parseEnvConfigBoolean", () => {
  test("returns true for exact lowercase true", () => {
    expect(parseEnvConfigBoolean("true")).toBe(true);
  });

  test("returns true for case-insensitive true with surrounding whitespace", () => {
    expect(parseEnvConfigBoolean("True")).toBe(true);
    expect(parseEnvConfigBoolean(" TRUE ")).toBe(true);
  });

  test("returns false for other values", () => {
    expect(parseEnvConfigBoolean(undefined)).toBe(false);
    expect(parseEnvConfigBoolean("")).toBe(false);
    expect(parseEnvConfigBoolean("false")).toBe(false);
    expect(parseEnvConfigBoolean("1")).toBe(false);
    expect(parseEnvConfigBoolean("yes")).toBe(false);
  });
});
