import { describe, expect, it } from "bun:test";
import {
  formatOffsetFromMinutes,
  formatRelativeTimezoneOffset,
  getTimezoneEmoji,
  getTimezoneOptions,
  getTimezonePathLabel,
  getTimezoneSelectLabel,
  isValidIanaTimezoneId,
  resolveBrowserIanaTimezoneId,
  toIanaTimezone,
  toIanaTimezoneOrNull,
} from "@/frontend/common/lib/timezone";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

describe("frontend/common/lib/timezone", () => {
  describe("isValidIanaTimezoneId", () => {
    it("returns true for valid standard IANA timezone IDs", () => {
      expect(isValidIanaTimezoneId("America/New_York")).toBe(true);
      expect(isValidIanaTimezoneId("Africa/Cairo")).toBe(true);
      expect(isValidIanaTimezoneId("Europe/London")).toBe(true);
      expect(isValidIanaTimezoneId("Asia/Riyadh")).toBe(true);
    });

    it("normalizes excluded legacy timezones to Palestine replacement", () => {
      // Asia/Jerusalem is excluded and maps to Palestine replacement Asia/Hebron
      expect(isValidIanaTimezoneId("Asia/Jerusalem")).toBe(true);
    });

    it("returns false for invalid timezone strings", () => {
      expect(isValidIanaTimezoneId("Invalid/Timezone")).toBe(false);
      expect(isValidIanaTimezoneId("")).toBe(false);
      expect(isValidIanaTimezoneId("Mars/Base")).toBe(false);
    });
  });

  describe("toIanaTimezone", () => {
    it("parses valid timezone strings to IanaTimezone enum", () => {
      expect(toIanaTimezone("Africa/Cairo")).toBe(IanaTimezone.Africa_Cairo);
      expect(toIanaTimezone("America/New_York")).toBe(IanaTimezone.America_New_York);
    });

    it("falls back to default if input is null or invalid", () => {
      expect(toIanaTimezone(null)).toBe(IanaTimezone.Africa_Cairo);
      expect(toIanaTimezone("Invalid/Zone")).toBe(IanaTimezone.Africa_Cairo);
      expect(toIanaTimezone("Invalid/Zone", IanaTimezone.Europe_London)).toBe(IanaTimezone.Europe_London);
    });
  });

  describe("toIanaTimezoneOrNull", () => {
    it("returns null for empty or null input", () => {
      expect(toIanaTimezoneOrNull(null)).toBeNull();
      expect(toIanaTimezoneOrNull(undefined)).toBeNull();
      expect(toIanaTimezoneOrNull("")).toBeNull();
    });

    it("returns parsed enum for valid input", () => {
      expect(toIanaTimezoneOrNull("Africa/Cairo")).toBe(IanaTimezone.Africa_Cairo);
    });
  });

  describe("formatOffsetFromMinutes", () => {
    it("formats positive and negative minute offsets correctly", () => {
      expect(formatOffsetFromMinutes(120)).toBe("+02:00");
      expect(formatOffsetFromMinutes(-300)).toBe("-05:00");
      expect(formatOffsetFromMinutes(0)).toBe("+00:00");
      expect(formatOffsetFromMinutes(330)).toBe("+05:30");
    });
  });

  describe("getTimezoneOptions", () => {
    it("generates a complete, sorted list of timezone options", () => {
      const options = getTimezoneOptions("en");
      expect(options.length).toBeGreaterThan(100);

      const first = options[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("label");
      expect(first).toHaveProperty("pathLabel");
      expect(first).toHaveProperty("offsetLabel");
      expect(first).toHaveProperty("offsetMinutes");
      expect(first).toHaveProperty("emoji");

      // Verify that options are sorted primarily by offsetMinutes ascending
      for (let i = 1; i < options.length; i++) {
        expect(options[i].offsetMinutes).toBeGreaterThanOrEqual(options[i - 1].offsetMinutes);
      }
    });

    it("supports Arabic locale labels", () => {
      const arOptions = getTimezoneOptions("ar");
      expect(arOptions.length).toBeGreaterThan(100);
      const cairoOption = arOptions.find(opt => opt.id === IanaTimezone.Africa_Cairo);
      expect(cairoOption).toBeDefined();
    });
  });

  describe("formatRelativeTimezoneOffset", () => {
    it("returns placeholder dash when target timezone is null", () => {
      expect(formatRelativeTimezoneOffset(null, "Africa/Cairo")).toBe("—");
    });

    it("computes relative offset between target and viewer timezones", () => {
      const fixedDate = new Date("2025-06-01T12:00:00Z");
      const relative = formatRelativeTimezoneOffset("Europe/London", "Africa/Cairo", fixedDate);
      expect(relative).toBeDefined();
      expect(typeof relative).toBe("string");
    });
  });

  describe("resolveBrowserIanaTimezoneId", () => {
    it("returns a valid IanaTimezone for browser environment", () => {
      const resolved = resolveBrowserIanaTimezoneId();
      expect(isValidIanaTimezoneId(resolved)).toBe(true);
    });
  });

  describe("getTimezonePathLabel and getTimezoneSelectLabel", () => {
    it("returns path label and select label for timezone", () => {
      const pathLabel = getTimezonePathLabel("Africa/Cairo", "en");
      expect(pathLabel).toBeDefined();

      const selectLabel = getTimezoneSelectLabel("Africa/Cairo", "en");
      expect(selectLabel).toContain(pathLabel);
    });
  });

  describe("getTimezoneEmoji", () => {
    it("returns emoji for known timezone territory or globe default", () => {
      const emoji = getTimezoneEmoji("Africa/Cairo");
      expect(emoji).toBeDefined();
      expect(typeof emoji).toBe("string");
    });
  });
});
