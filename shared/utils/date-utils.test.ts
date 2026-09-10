import { describe, expect, test } from "bun:test";
import { formatTimestamp } from "./date-utils";

describe("date-utils", () => {
  describe("formatTimestamp", () => {
    test("formats date with single digit components correctly", () => {
      const date = new Date(2026, 0, 2, 3, 4, 5, 6);
      expect(formatTimestamp(date)).toBe("2026-01-02 03:04:05.006");
    });

    test("formats date with double digit components correctly", () => {
      const date = new Date(2026, 11, 25, 14, 30, 45, 789);
      expect(formatTimestamp(date)).toBe("2026-12-25 14:30:45.789");
    });

    test("formats date with 2-digit milliseconds correctly", () => {
      const date = new Date(2026, 5, 15, 9, 8, 7, 50);
      expect(formatTimestamp(date)).toBe("2026-06-15 09:08:07.050");
    });

    test("defaults to current date when called without parameters", () => {
      const result = formatTimestamp();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/);
    });
  });
});
