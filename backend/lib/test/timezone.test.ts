import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { logger } from "@/backend/lib/logger";
import {
  formatInstantInTimezone,
  getDayBoundaries,
  isValidIanaTimezone,
  normalizeIanaTimezone,
} from "@/backend/lib/timezone";

describe("timezone utilities (backend/lib/timezone.ts)", () => {
  const errorSpy = spyOn(logger, "error").mockImplementation(() => {});

  afterEach(() => {
    errorSpy.mockClear();
  });

  describe("normalizeIanaTimezone", () => {
    test("normalizes excluded IANA timezone ID to its Palestinian replacement", () => {
      expect(normalizeIanaTimezone("Asia/Jerusalem")).toBe("Asia/Hebron");
    });

    test("returns standard IANA timezones unchanged", () => {
      expect(normalizeIanaTimezone("America/New_York")).toBe("America/New_York");
      expect(normalizeIanaTimezone("UTC")).toBe("UTC");
      expect(normalizeIanaTimezone("Europe/London")).toBe("Europe/London");
    });

    test("returns non-standard string unchanged", () => {
      expect(normalizeIanaTimezone("Unknown/Zone")).toBe("Unknown/Zone");
      expect(normalizeIanaTimezone("")).toBe("");
    });
  });

  describe("isValidIanaTimezone", () => {
    test("returns true for standard valid IANA timezones", () => {
      expect(isValidIanaTimezone("America/New_York")).toBe(true);
      expect(isValidIanaTimezone("UTC")).toBe(true);
      expect(isValidIanaTimezone("Asia/Hebron")).toBe(true);
      expect(isValidIanaTimezone("Europe/London")).toBe(true);
    });

    test("returns true for excluded timezone which normalizes to a valid replacement", () => {
      expect(isValidIanaTimezone("Asia/Jerusalem")).toBe(true);
    });

    test("returns false for invalid or unknown timezones", () => {
      expect(isValidIanaTimezone("Invalid/Timezone")).toBe(false);
      expect(isValidIanaTimezone("NotATimezone")).toBe(false);
      expect(isValidIanaTimezone("")).toBe(false);
      expect(isValidIanaTimezone("GMT+5")).toBe(false);
    });
  });

  describe("formatInstantInTimezone", () => {
    test("formats valid date in target timezone with default locale (en-US)", () => {
      // 2026-05-15T14:30:00Z -> 10:30 AM in America/New_York (EDT, UTC-4)
      const date = new Date("2026-05-15T14:30:00Z");
      const formatted = formatInstantInTimezone(date, "America/New_York");
      expect(formatted).toBe("10:30 AM");
    });

    test("formats valid date with specified custom locale", () => {
      // 2026-05-15T14:30:00Z -> 02:30 PM in UTC
      const date = new Date("2026-05-15T14:30:00Z");
      const formatted = formatInstantInTimezone(date, "UTC", "en-US");
      expect(formatted).toBe("02:30 PM");
    });

    test("falls back to UTC and logs error when invalid timezone is provided", () => {
      const date = new Date("2026-05-15T14:30:00Z");
      const formatted = formatInstantInTimezone(date, "Invalid/Timezone_Name");

      expect(formatted).toBe("02:30 PM"); // 14:30 UTC in 12-hour format
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.mock.calls[0][0]).toBe("Failed to format date in timezone, falling back to UTC");
      expect(errorSpy.mock.calls[0][1]).toMatchObject({
        ianaTimezone: "Invalid/Timezone_Name",
      });
    });

    test("logs error and rethrows when invalid date is provided", () => {
      const invalidDate = new Date(Number.NaN);

      expect(() => formatInstantInTimezone(invalidDate, "America/New_York")).toThrow(RangeError);
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.mock.calls[0][0]).toBe("Failed to format date in timezone, falling back to UTC");
      expect(errorSpy.mock.calls[0][1]).toMatchObject({
        date: "Invalid Date",
      });
    });
  });

  describe("getDayBoundaries", () => {
    test("calculates start and end of day for UTC timezone", () => {
      const date = new Date("2026-05-15T14:30:00Z");
      const { startOfDayUtc, endOfDayUtc } = getDayBoundaries(date, "UTC");

      expect(startOfDayUtc.toISOString()).toBe("2026-05-15T00:00:00.000Z");
      expect(endOfDayUtc.toISOString()).toBe("2026-05-16T00:00:00.000Z");
    });

    test("calculates start and end of day for negative offset timezone (America/New_York EDT = UTC-4)", () => {
      const date = new Date("2026-05-15T14:30:00Z");
      const { startOfDayUtc, endOfDayUtc } = getDayBoundaries(date, "America/New_York");

      // Local day 2026-05-15 in New York (EDT, UTC-4) starts at 2026-05-15 00:00:00 EDT = 2026-05-15 04:00:00 UTC
      // and ends at 2026-05-16 00:00:00 EDT = 2026-05-16 04:00:00 UTC
      expect(startOfDayUtc.toISOString()).toBe("2026-05-15T04:00:00.000Z");
      expect(endOfDayUtc.toISOString()).toBe("2026-05-16T04:00:00.000Z");
    });

    test("calculates start and end of day for positive non-integer offset timezone (Asia/Kolkata IST = UTC+5:30)", () => {
      const date = new Date("2026-05-15T14:30:00Z");
      const { startOfDayUtc, endOfDayUtc } = getDayBoundaries(date, "Asia/Kolkata");

      // Local day 2026-05-15 in Kolkata (UTC+5:30) starts at 2026-05-15 00:00:00 IST = 2026-05-14 18:30:00 UTC
      // and ends at 2026-05-16 00:00:00 IST = 2026-05-15 18:30:00 UTC
      expect(startOfDayUtc.toISOString()).toBe("2026-05-14T18:30:00.000Z");
      expect(endOfDayUtc.toISOString()).toBe("2026-05-15T18:30:00.000Z");
    });

    test("falls back to UTC day boundaries and logs error when invalid timezone is provided", () => {
      const date = new Date("2026-05-15T14:30:00Z");
      const { startOfDayUtc, endOfDayUtc } = getDayBoundaries(date, "Invalid/Timezone");

      expect(startOfDayUtc.toISOString()).toBe("2026-05-15T00:00:00.000Z");
      expect(endOfDayUtc.toISOString()).toBe("2026-05-16T00:00:00.000Z");
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.mock.calls[0][0]).toBe("Failed to calculate day boundaries, falling back to UTC");
    });

    test("falls back to UTC day boundaries with current date and logs error when invalid date is provided", () => {
      const invalidDate = new Date(Number.NaN);
      const { startOfDayUtc, endOfDayUtc } = getDayBoundaries(invalidDate, "UTC");

      expect(startOfDayUtc).toBeInstanceOf(Date);
      expect(endOfDayUtc).toBeInstanceOf(Date);
      expect(Number.isNaN(startOfDayUtc.getTime())).toBe(false);
      expect(Number.isNaN(endOfDayUtc.getTime())).toBe(false);
      expect(endOfDayUtc.getTime() - startOfDayUtc.getTime()).toBe(24 * 60 * 60 * 1000); // 24 hours
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.mock.calls[0][0]).toBe("Failed to calculate day boundaries, falling back to UTC");
      expect(errorSpy.mock.calls[0][1]).toMatchObject({
        date: "Invalid Date",
      });
    });
  });
});
