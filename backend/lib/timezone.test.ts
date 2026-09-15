import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { logger } from "@/backend/lib/logger";
import {
  formatInstantInTimezone,
  getDayBoundaries,
  getOffsetMinutes,
  getOffsetMs,
  isValidIanaTimezone,
  normalizeIanaTimezone,
} from "@/backend/lib/timezone";

describe("timezone lib", () => {
  let errorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    errorSpy = spyOn(logger, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  describe("normalizeIanaTimezone", () => {
    test("returns the input value for standard timezones", () => {
      expect(normalizeIanaTimezone("America/New_York")).toBe("America/New_York");
      expect(normalizeIanaTimezone("UTC")).toBe("UTC");
    });

    test("normalizes excluded legacy timezones to Palestine replacement", () => {
      expect(normalizeIanaTimezone("Asia/Jerusalem")).toBe("Asia/Hebron");
    });

    test("returns non-standard strings unchanged", () => {
      expect(normalizeIanaTimezone("Unknown/Zone")).toBe("Unknown/Zone");
      expect(normalizeIanaTimezone("")).toBe("");
    });
  });

  describe("getOffsetMs and getOffsetMinutes", () => {
    test("calculates correct offset in ms and minutes for EST/EDT (America/New_York)", () => {
      const winterDate = new Date("2025-01-15T12:00:00Z"); // EST: UTC-5
      expect(getOffsetMs("America/New_York", winterDate)).toBe(-5 * 3600 * 1000);
      expect(getOffsetMinutes("America/New_York", winterDate)).toBe(-300);

      const summerDate = new Date("2025-07-15T12:00:00Z"); // EDT: UTC-4
      expect(getOffsetMs("America/New_York", summerDate)).toBe(-4 * 3600 * 1000);
      expect(getOffsetMinutes("America/New_York", summerDate)).toBe(-240);
    });

    test("returns 0 / null for invalid timezones safely", () => {
      const date = new Date("2025-01-15T12:00:00Z");
      expect(getOffsetMs("Invalid/Timezone", date)).toBe(0);
      expect(getOffsetMinutes("Invalid/Timezone", date)).toBeNull();
    });
  });

  describe("isValidIanaTimezone", () => {
    test("returns true for valid standard timezones", () => {
      expect(isValidIanaTimezone("America/New_York")).toBe(true);
      expect(isValidIanaTimezone("UTC")).toBe(true);
      expect(isValidIanaTimezone("Europe/London")).toBe(true);
    });

    test("returns true for excluded legacy timezones that normalize to a valid timezone", () => {
      expect(isValidIanaTimezone("Asia/Jerusalem")).toBe(true);
    });

    test("returns false for invalid timezone strings", () => {
      expect(isValidIanaTimezone("Invalid/Timezone")).toBe(false);
      expect(isValidIanaTimezone("Mars/Base")).toBe(false);
      expect(isValidIanaTimezone("")).toBe(false);
    });
  });

  describe("formatInstantInTimezone", () => {
    test("formats instant in valid timezone with default locale", () => {
      const date = new Date("2025-06-15T14:30:00Z");
      const formatted = formatInstantInTimezone(date, "America/New_York");
      expect(formatted).toMatch(/10:30\s?AM/);
    });

    test("formats instant with custom locale", () => {
      const date = new Date("2025-06-15T14:30:00Z");
      const formatted = formatInstantInTimezone(date, "America/New_York", "en-US");
      expect(formatted).toMatch(/10:30\s?AM/);
    });

    test("triggers catch block when an invalid timezone is provided, logging error and falling back to UTC", () => {
      const date = new Date("2025-06-15T14:30:00Z");
      const invalidTz = "Invalid/Timezone_String";

      const result = formatInstantInTimezone(date, invalidTz);

      expect(result).toMatch(/02:30\s?PM/);
      expect(errorSpy).toHaveBeenCalledTimes(1);
      const [msg, context] = errorSpy.mock.calls[0];
      expect(msg).toBe("Failed to format date in timezone, falling back to UTC");
      expect(context).toMatchObject({
        ianaTimezone: invalidTz,
        date: date.toISOString(),
      });
      expect(context.error).toBeDefined();
    });

    test("logs error and rethrows when an invalid date is provided", () => {
      const invalidDate = new Date(Number.NaN);
      const invalidTz = "Bad/TZ";

      expect(() => formatInstantInTimezone(invalidDate, invalidTz)).toThrow(RangeError);

      expect(errorSpy).toHaveBeenCalledTimes(1);
      const [msg, context] = errorSpy.mock.calls[0];
      expect(msg).toBe("Failed to format date in timezone, falling back to UTC");
      expect(context).toMatchObject({
        ianaTimezone: invalidTz,
        date: "Invalid Date",
      });
    });
  });

  describe("getDayBoundaries", () => {
    test("calculates start and end of day boundaries in UTC for valid timezone", () => {
      const date = new Date("2025-06-15T12:00:00Z");
      const boundaries = getDayBoundaries(date, "UTC");
      expect(boundaries.startOfDayUtc.toISOString()).toBe("2025-06-15T00:00:00.000Z");
      expect(boundaries.endOfDayUtc.toISOString()).toBe("2025-06-16T00:00:00.000Z");
    });

    test("calculates boundaries for a non-integer offset timezone (Asia/Kolkata, UTC+5:30)", () => {
      const date = new Date("2026-05-15T14:30:00Z");
      const { startOfDayUtc, endOfDayUtc } = getDayBoundaries(date, "Asia/Kolkata");

      // Local day 2026-05-15 in Kolkata starts at 2026-05-14 18:30 UTC and ends at 2026-05-15 18:30 UTC
      expect(startOfDayUtc.toISOString()).toBe("2026-05-14T18:30:00.000Z");
      expect(endOfDayUtc.toISOString()).toBe("2026-05-15T18:30:00.000Z");
    });

    test("triggers catch block when an invalid timezone is provided to getDayBoundaries", () => {
      const date = new Date("2025-06-15T12:00:00Z");
      const invalidTz = "Invalid/Timezone";

      const boundaries = getDayBoundaries(date, invalidTz);

      expect(errorSpy).toHaveBeenCalledTimes(1);
      const [msg, context] = errorSpy.mock.calls[0];
      expect(msg).toBe("Failed to calculate day boundaries, falling back to UTC");
      expect(context).toMatchObject({
        ianaTimezone: invalidTz,
        date: date.toISOString(),
      });

      expect(boundaries.startOfDayUtc.toISOString()).toBe("2025-06-15T00:00:00.000Z");
      expect(boundaries.endOfDayUtc.toISOString()).toBe("2025-06-16T00:00:00.000Z");
    });

    test("handles invalid date in getDayBoundaries error catch block", () => {
      const invalidDate = new Date(Number.NaN);
      const invalidTz = "Invalid/Timezone";

      const boundaries = getDayBoundaries(invalidDate, invalidTz);

      expect(errorSpy).toHaveBeenCalledTimes(1);
      const [msg, context] = errorSpy.mock.calls[0];
      expect(msg).toBe("Failed to calculate day boundaries, falling back to UTC");
      expect(context).toMatchObject({
        ianaTimezone: invalidTz,
        date: "Invalid Date",
      });
      expect(boundaries.startOfDayUtc).toBeInstanceOf(Date);
      expect(boundaries.endOfDayUtc).toBeInstanceOf(Date);
    });
  });
});
