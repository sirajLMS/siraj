import { describe, expect, test } from "bun:test";
import {
  computeBackoffSeconds,
  InvalidCronExpression,
  nextRunAt,
  _nextRunsForTest as nextRuns,
  validateCronExpression,
} from "@/backend/services/cron/cron-scheduler.engine";

describe("cron-scheduler.engine", () => {
  describe("validateCronExpression", () => {
    test("returns true for valid expressions", () => {
      expect(validateCronExpression("*/5 * * * *")).toBe(true);
      expect(validateCronExpression("0 9 * * 1-5")).toBe(true);
      expect(validateCronExpression("0 0 1 * *")).toBe(true);
    });

    test("returns false for invalid expressions", () => {
      expect(validateCronExpression("not-a-cron")).toBe(false);
      expect(validateCronExpression("* * * * * * * * *")).toBe(false);
      expect(validateCronExpression("99 * * * *")).toBe(false);
    });
  });

  describe("nextRunAt", () => {
    test("computes next run from a fixed baseline", () => {
      const baseline = new Date("2025-01-01T00:00:00Z");
      const result = nextRunAt("0 9 * * *", baseline);
      // Next 9AM from midnight Jan 1 is Jan 1 09:00 UTC
      expect(result.toISOString()).toBe("2025-01-01T09:00:00.000Z");
    });

    test("throws InvalidCronExpression for bad expression", () => {
      expect(() => nextRunAt("not-a-cron", new Date())).toThrow(InvalidCronExpression);
    });

    test("respects timezone parameter", () => {
      const baseline = new Date("2025-01-01T00:00:00Z");
      // 9 AM in Africa/Cairo (UTC+2) → 07:00 UTC
      const result = nextRunAt("0 9 * * *", baseline, "Africa/Cairo");
      expect(result.getUTCHours()).toBe(7);
    });

    test("should evaluate @yearly macro", () => {
      const result = nextRunAt("@yearly", new Date("2024-06-15T10:00:00Z"), "UTC");
      expect(result).toBeDefined();
      expect(result?.getUTCMonth()).toBe(0); // January
      expect(result?.getUTCDate()).toBe(1);
      expect(result?.getUTCHours()).toBe(0);
    });

    test("should evaluate @annually macro (alias of @yearly)", () => {
      const result = nextRunAt("@annually", new Date("2024-06-15T10:00:00Z"), "UTC");
      expect(result).toBeDefined();
      expect(result?.getUTCMonth()).toBe(0); // January
      expect(result?.getUTCDate()).toBe(1);
      expect(result?.getUTCHours()).toBe(0);
    });

    test("should handle L (last day of month) token", () => {
      // 2024 is a leap year — February has 29 days
      const result = nextRunAt("0 0 L * *", new Date("2024-02-15T10:00:00Z"), "UTC");
      expect(result).toBeDefined();
      const lastDay = new Date(Date.UTC(result?.getUTCFullYear(), result?.getUTCMonth() + 1, 0)).getUTCDate();
      expect(result?.getUTCDate()).toBe(lastDay);
      expect(result?.getUTCDate()).toBe(29); // Feb 29 in leap year 2024
    });

    test("should handle # (nth weekday) token", () => {
      // 1#3 = 3rd Monday of the month (cron-parser: 0=Sunday, 1=Monday)
      const result = nextRunAt("0 0 ? * 1#3", new Date("2024-02-15T10:00:00Z"), "UTC");
      expect(result).toBeDefined();
      expect(result?.getUTCDay()).toBe(1); // Monday
      // 3rd Monday of Feb 2024 = Feb 19
      expect(result?.getUTCDate()).toBe(19);
    });
  });

  describe("nextRuns", () => {
    test("returns N monotonically increasing dates", () => {
      const baseline = new Date("2025-01-01T00:00:00Z");
      const runs = nextRuns("*/5 * * * *", baseline, 5);

      expect(runs).toHaveLength(5);
      for (let i = 1; i < runs.length; i++) {
        expect(runs[i].getTime()).toBeGreaterThan(runs[i - 1].getTime());
      }
    });

    test("throws InvalidCronExpression for bad expression", () => {
      expect(() => nextRuns("not-a-cron", new Date(), 3)).toThrow(InvalidCronExpression);
    });
  });

  describe("computeBackoffSeconds", () => {
    test("returns base delay for attempt 1", () => {
      expect(computeBackoffSeconds(60, 1)).toBe(60);
    });

    test("doubles for attempt 2", () => {
      expect(computeBackoffSeconds(60, 2)).toBe(120);
    });

    test("quadruples for attempt 3", () => {
      expect(computeBackoffSeconds(60, 3)).toBe(240);
    });

    test("uses exponential formula: base * 2^(attempt-1)", () => {
      expect(computeBackoffSeconds(30, 1)).toBe(30);
      expect(computeBackoffSeconds(30, 2)).toBe(60);
      expect(computeBackoffSeconds(30, 3)).toBe(120);
      expect(computeBackoffSeconds(30, 4)).toBe(240);
    });

    test("caps at MAX_BACKOFF_SECONDS (86400)", () => {
      expect(computeBackoffSeconds(60, 12)).toBe(86_400); // 60 * 2^11 = 122_880 → capped
      expect(computeBackoffSeconds(3600, 6)).toBe(86_400); // 3600 * 2^5 = 115_200 → capped
      expect(computeBackoffSeconds(86_400, 1)).toBe(86_400); // exactly the cap
      expect(computeBackoffSeconds(86_401, 1)).toBe(86_400); // above the cap
    });
  });
});
