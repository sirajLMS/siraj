import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { logger } from "@/backend/lib/logger";
import {
  formatInstantInTimezone,
  getDayBoundaries,
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
    it("returns the input value for standard timezones", () => {
      expect(normalizeIanaTimezone("America/New_York")).toBe("America/New_York");
      expect(normalizeIanaTimezone("UTC")).toBe("UTC");
    });

    it("normalizes excluded legacy timezones to Palestine replacement", () => {
      expect(normalizeIanaTimezone("Asia/Jerusalem")).toBe("Asia/Hebron");
    });
  });

  describe("isValidIanaTimezone", () => {
    it("returns true for valid standard timezones", () => {
      expect(isValidIanaTimezone("America/New_York")).toBe(true);
      expect(isValidIanaTimezone("UTC")).toBe(true);
      expect(isValidIanaTimezone("Europe/London")).toBe(true);
    });

    it("returns true for excluded legacy timezones that normalize to a valid timezone", () => {
      expect(isValidIanaTimezone("Asia/Jerusalem")).toBe(true);
    });

    it("returns false for invalid timezone strings", () => {
      expect(isValidIanaTimezone("Invalid/Timezone")).toBe(false);
      expect(isValidIanaTimezone("Mars/Base")).toBe(false);
      expect(isValidIanaTimezone("")).toBe(false);
    });
  });

  describe("formatInstantInTimezone", () => {
    it("formats instant in valid timezone with default locale", () => {
      const date = new Date("2025-06-15T14:30:00Z");
      const formatted = formatInstantInTimezone(date, "America/New_York");
      expect(formatted).toMatch(/10:30\s?AM/);
    });

    it("formats instant with custom locale", () => {
      const date = new Date("2025-06-15T14:30:00Z");
      const formatted = formatInstantInTimezone(date, "America/New_York", "en-US");
      expect(formatted).toMatch(/10:30\s?AM/);
    });

    it("triggers catch block when an invalid timezone is provided, logging error and falling back to UTC", () => {
      const date = new Date("2025-06-15T14:30:00Z");
      const invalidTz = "Invalid/Timezone_String";

      const result = formatInstantInTimezone(date, invalidTz);

      expect(result).toMatch(/02:30\s?PM/);
      expect(errorSpy).toHaveBeenCalledTimes(1);
      const [msg, context] = errorSpy.mock.calls[0] as [string, { error: unknown; ianaTimezone: string; date: string }];
      expect(msg).toBe("Failed to format date in timezone, falling back to UTC");
      expect(context).toMatchObject({
        ianaTimezone: invalidTz,
        date: date.toISOString(),
      });
      expect(context.error).toBeDefined();
    });

    it("logs error and handles invalid date in formatInstantInTimezone catch block", () => {
      const invalidDate = new Date(NaN);
      const invalidTz = "Bad/TZ";

      expect(() => formatInstantInTimezone(invalidDate, invalidTz)).toThrow(RangeError);

      expect(errorSpy).toHaveBeenCalledTimes(1);
      const [msg, context] = errorSpy.mock.calls[0] as [string, { error: unknown; ianaTimezone: string; date: string }];
      expect(msg).toBe("Failed to format date in timezone, falling back to UTC");
      expect(context).toMatchObject({
        ianaTimezone: invalidTz,
        date: "Invalid Date",
      });
    });
  });

  describe("getDayBoundaries", () => {
    it("calculates start and end of day boundaries in UTC for valid timezone", () => {
      const date = new Date("2025-06-15T12:00:00Z");
      const boundaries = getDayBoundaries(date, "UTC");
      expect(boundaries.startOfDayUtc.toISOString()).toBe("2025-06-15T00:00:00.000Z");
      expect(boundaries.endOfDayUtc.toISOString()).toBe("2025-06-16T00:00:00.000Z");
    });

    it("triggers catch block when an invalid timezone is provided to getDayBoundaries", () => {
      const date = new Date("2025-06-15T12:00:00Z");
      const invalidTz = "Invalid/Timezone";

      const boundaries = getDayBoundaries(date, invalidTz);

      expect(errorSpy).toHaveBeenCalledTimes(1);
      const [msg, context] = errorSpy.mock.calls[0] as [string, { error: unknown; ianaTimezone: string; date: string }];
      expect(msg).toBe("Failed to calculate day boundaries, falling back to UTC");
      expect(context).toMatchObject({
        ianaTimezone: invalidTz,
        date: date.toISOString(),
      });

      expect(boundaries.startOfDayUtc.toISOString()).toBe("2025-06-15T00:00:00.000Z");
      expect(boundaries.endOfDayUtc.toISOString()).toBe("2025-06-16T00:00:00.000Z");
    });

    it("handles invalid date in getDayBoundaries error catch block", () => {
      const invalidDate = new Date(NaN);
      const invalidTz = "Invalid/Timezone";

      const boundaries = getDayBoundaries(invalidDate, invalidTz);

      expect(errorSpy).toHaveBeenCalledTimes(1);
      const [msg, context] = errorSpy.mock.calls[0] as [string, { error: unknown; ianaTimezone: string; date: string }];
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
