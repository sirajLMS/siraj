import { describe, expect, mock, spyOn, test } from "bun:test";
import { logger } from "@/backend/lib/logger";
import {
  formatInstantInTimezone,
  getDayBoundaries,
  isValidIanaTimezone,
  normalizeIanaTimezone,
} from "@/backend/lib/timezone";

describe("timezone utilities", () => {
  describe("normalizeIanaTimezone", () => {
    test("normalizes standard and excluded IANA timezone strings", () => {
      expect(normalizeIanaTimezone("America/New_York")).toBe("America/New_York");
      expect(normalizeIanaTimezone("Asia/Jerusalem")).toBe("Asia/Hebron");
    });
  });

  describe("isValidIanaTimezone", () => {
    test("validates timezone IDs correctly", () => {
      expect(isValidIanaTimezone("America/New_York")).toBe(true);
      expect(isValidIanaTimezone("Europe/London")).toBe(true);
      expect(isValidIanaTimezone("Invalid/Timezone")).toBe(false);
      expect(isValidIanaTimezone("Asia/Jerusalem")).toBe(true);
    });
  });

  describe("formatInstantInTimezone", () => {
    test("formats date in given valid timezone and locale", () => {
      const date = new Date("2026-06-15T12:00:00Z");
      const result = formatInstantInTimezone(date, "UTC", "en");
      expect(result).toBe("12:00 PM");
    });

    test("falls back to UTC and logs error when timezone is invalid", () => {
      const loggerSpy = spyOn(logger, "error").mockImplementation(() => {});
      try {
        const date = new Date("2026-06-15T12:00:00Z");
        const result = formatInstantInTimezone(date, "Invalid/Timezone", "en");
        expect(result).toBe("12:00 PM");
        expect(loggerSpy).toHaveBeenCalledWith(
          "Failed to format date in timezone, falling back to UTC",
          expect.objectContaining({
            ianaTimezone: "Invalid/Timezone",
            date: date.toISOString(),
          }),
        );
      } finally {
        loggerSpy.mockRestore();
      }
    });

    test("falls back to UTC and logs error when date is invalid", () => {
      const loggerSpy = spyOn(logger, "error").mockImplementation(() => {});
      try {
        const invalidDate = new Date(Number.NaN);
        expect(() => formatInstantInTimezone(invalidDate, "America/New_York", "en")).toThrow();
        expect(loggerSpy).toHaveBeenCalledWith(
          "Failed to format date in timezone, falling back to UTC",
          expect.objectContaining({
            ianaTimezone: "America/New_York",
            date: "Invalid Date",
          }),
        );
      } finally {
        loggerSpy.mockRestore();
      }
    });
  });

  describe("getDayBoundaries", () => {
    test("calculates start and end day boundaries for valid timezone", () => {
      const date = new Date("2026-06-15T12:00:00Z");
      const { startOfDayUtc, endOfDayUtc } = getDayBoundaries(date, "UTC");

      expect(startOfDayUtc.toISOString()).toBe("2026-06-15T00:00:00.000Z");
      expect(endOfDayUtc.toISOString()).toBe("2026-06-16T00:00:00.000Z");
    });

    test("calculates start and end day boundaries for offset timezone", () => {
      const date = new Date("2026-06-15T12:00:00Z");
      // America/New_York is UTC-4 in June (EDT)
      const { startOfDayUtc, endOfDayUtc } = getDayBoundaries(date, "America/New_York");

      expect(startOfDayUtc.toISOString()).toBe("2026-06-15T04:00:00.000Z");
      expect(endOfDayUtc.toISOString()).toBe("2026-06-16T04:00:00.000Z");
    });

    test("falls back to UTC and logs error when passed an invalid timezone", () => {
      const loggerSpy = spyOn(logger, "error").mockImplementation(() => {});
      try {
        const date = new Date("2026-06-15T14:30:00Z");
        const { startOfDayUtc, endOfDayUtc } = getDayBoundaries(date, "Invalid/Timezone");

        expect(startOfDayUtc.toISOString()).toBe("2026-06-15T00:00:00.000Z");
        expect(endOfDayUtc.toISOString()).toBe("2026-06-16T00:00:00.000Z");

        expect(loggerSpy).toHaveBeenCalledWith(
          "Failed to calculate day boundaries, falling back to UTC",
          expect.objectContaining({
            ianaTimezone: "Invalid/Timezone",
            date: "2026-06-15T14:30:00.000Z",
          }),
        );
      } finally {
        loggerSpy.mockRestore();
      }
    });

    test("falls back to current date in UTC and logs error when passed an invalid Date", () => {
      const loggerSpy = spyOn(logger, "error").mockImplementation(() => {});
      try {
        const invalidDate = new Date(Number.NaN);
        const beforeTest = new Date();

        const { startOfDayUtc, endOfDayUtc } = getDayBoundaries(invalidDate, "America/New_York");

        const afterTest = new Date();

        expect(Number.isNaN(startOfDayUtc.getTime())).toBe(false);
        expect(Number.isNaN(endOfDayUtc.getTime())).toBe(false);
        expect(endOfDayUtc.getTime() - startOfDayUtc.getTime()).toBe(24 * 60 * 60 * 1000);

        // Verify fallback date is roughly 'now'
        expect(startOfDayUtc.getTime()).toBeLessThanOrEqual(beforeTest.getTime());
        expect(endOfDayUtc.getTime()).toBeGreaterThanOrEqual(afterTest.getTime());

        expect(loggerSpy).toHaveBeenCalledWith(
          "Failed to calculate day boundaries, falling back to UTC",
          expect.objectContaining({
            ianaTimezone: "America/New_York",
            date: "Invalid Date",
          }),
        );
      } finally {
        loggerSpy.mockRestore();
      }
    });
  });
});
