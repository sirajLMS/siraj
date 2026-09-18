import { describe, expect, it } from "bun:test";
import { formatAuditTimestamp } from "@/frontend/common/views/dashboard/classes/audit/utils/formatAuditTimestamp.utils";
import {
  formatDate,
  formatDateInput,
  formatDateTime,
  formatMonthYear,
  formatTime,
  getDateTimeFormatter,
  parseDateInput,
} from "./dateFormat";

describe("dateFormat helpers", () => {
  describe("parseDateInput", () => {
    it("handles null and undefined", () => {
      expect(parseDateInput(null)).toBeNull();
      expect(parseDateInput(undefined)).toBeNull();
    });

    it("parses valid Date instances", () => {
      const date = new Date("2026-07-18T10:00:00Z");
      expect(parseDateInput(date)).toEqual(date);
    });

    it("returns null for invalid Date instances", () => {
      expect(parseDateInput(new Date(NaN))).toBeNull();
    });

    it("parses timestamp numbers", () => {
      const ms = 1700000000000;
      expect(parseDateInput(ms)).toEqual(new Date(ms));
    });

    it("parses valid date strings and handles whitespace/invalid strings", () => {
      expect(parseDateInput("2026-07-18T10:00:00Z")).toBeInstanceOf(Date);
      expect(parseDateInput("   ")).toBeNull();
      expect(parseDateInput("not-a-date")).toBeNull();
    });
  });

  describe("formatDateInput", () => {
    it("formats Date into yyyy-MM-dd", () => {
      const date = new Date("2026-07-18T12:00:00Z");
      expect(formatDateInput(date)).toBe("2026-07-18");
    });

    it("returns empty string for null or invalid date", () => {
      expect(formatDateInput(null)).toBe("");
      expect(formatDateInput(new Date(NaN))).toBe("");
    });
  });

  describe("date and time formatters", () => {
    const testDate = new Date("2026-07-18T13:20:00Z");

    it("formats dates with formatDate", () => {
      const formatted = formatDate(testDate, "en");
      expect(formatted).toContain("Jul");
      expect(formatted).toContain("18");
      expect(formatted).toContain("2026");
    });

    it("formats date and time with formatDateTime", () => {
      const formatted = formatDateTime(testDate, "en");
      expect(formatted).toContain("Jul");
      expect(formatted).toContain("18");
      expect(formatted).toContain("2026");
    });

    it("formats time with formatTime", () => {
      const formatted = formatTime(testDate, "en");
      expect(formatted).toMatch(/\d{1,2}:\d{2}/);
    });

    it("formats month and year with formatMonthYear", () => {
      const formatted = formatMonthYear(testDate, "en");
      expect(formatted).toContain("July");
      expect(formatted).toContain("2026");
    });

    it("uses fallback value when date input is invalid or null", () => {
      expect(formatDate(null, "en", "N/A")).toBe("N/A");
      expect(formatDate("invalid-date", "en", "N/A")).toBe("invalid-date");
    });
  });

  describe("getDateTimeFormatter cache", () => {
    it("returns identical Intl.DateTimeFormat instance for same options reference", () => {
      const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short" };
      const dtf1 = getDateTimeFormatter("en-US", options);
      const dtf2 = getDateTimeFormatter("en-US", options);
      expect(dtf1).toBe(dtf2);
    });

    it("returns cached instance across separate options objects with identical structure", () => {
      const optionsA: Intl.DateTimeFormatOptions = { year: "numeric", month: "short" };
      const optionsB: Intl.DateTimeFormatOptions = { year: "numeric", month: "short" };
      const dtf1 = getDateTimeFormatter("en-US", optionsA);
      const dtf2 = getDateTimeFormatter("en-US", optionsB);
      expect(dtf1).toBe(dtf2);
    });
  });

  describe("formatAuditTimestamp", () => {
    it("formats valid ISO timestamp", () => {
      const formatted = formatAuditTimestamp("2026-07-18T14:30:00Z", "en");
      expect(formatted).toContain("2026");
    });

    it("returns fallback for null, undefined, or empty timestamp", () => {
      expect(formatAuditTimestamp(null, "en")).toBe("—");
      expect(formatAuditTimestamp(undefined, "en")).toBe("—");
      expect(formatAuditTimestamp("", "en")).toBe("—");
    });

    it("returns raw string for unparsable timestamp", () => {
      expect(formatAuditTimestamp("unparsable-timestamp", "en")).toBe("unparsable-timestamp");
    });
  });
});
