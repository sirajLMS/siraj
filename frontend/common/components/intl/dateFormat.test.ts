import { describe, expect, it } from "bun:test";
import {
  formatDate,
  formatDateInput,
  formatDateTime,
  formatMonthYear,
  formatTime,
  getDateTimeFormatter,
  parseDateInput,
} from "@/frontend/common/components/intl/dateFormat";
import { formatAuditTimestamp } from "@/frontend/common/views/dashboard/classes/audit/utils/formatAuditTimestamp.utils";

describe("dateFormat helpers", () => {
  describe("parseDateInput", () => {
    it("handles null and undefined", () => {
      expect(parseDateInput(null)).toBeNull();
      expect(parseDateInput(undefined)).toBeNull();
    });

    it("parses valid Date instances", () => {
      const date = new Date(2026, 6, 18, 10, 0, 0);
      expect(parseDateInput(date)).toEqual(date);
    });

    it("returns null for invalid Date instances", () => {
      expect(parseDateInput(new Date(Number.NaN))).toBeNull();
    });

    it("parses timestamp numbers", () => {
      const ms = 1_700_000_000_000;
      expect(parseDateInput(ms)).toEqual(new Date(ms));
      expect(parseDateInput(Number.NaN)).toBeNull();
    });

    it("parses valid date strings and handles whitespace and invalid strings", () => {
      expect(parseDateInput("2026-07-18")).toBeInstanceOf(Date);
      expect(parseDateInput("invalid date")).toBeNull();
      expect(parseDateInput("   ")).toBeNull();
    });
  });

  describe("formatDateInput", () => {
    it("formats Date into yyyy-MM-dd", () => {
      const date = new Date(2026, 6, 18, 12, 0, 0);
      expect(formatDateInput(date)).toBe("2026-07-18");
    });

    it("returns empty string for null or invalid date", () => {
      expect(formatDateInput(null)).toBe("");
      expect(formatDateInput(new Date(Number.NaN))).toBe("");
    });
  });

  describe("date and time formatters", () => {
    const testDate = new Date(2026, 6, 18, 13, 20, 0);

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

    it("uses fallback value when date input is unparsable", () => {
      expect(formatDate("", "en", "N/A")).toBe("N/A");
      expect(formatDate("invalid-date", "en", "N/A")).toBe("invalid-date");
      expect(() => formatMonthYear("invalid-date", "en")).toThrow(RangeError);
    });
  });

  describe("getDateTimeFormatter cache", () => {
    it("returns an identical instance for the same options reference", () => {
      const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short" };
      const dtf1 = getDateTimeFormatter("en-US", options);
      const dtf2 = getDateTimeFormatter("en-US", options);
      expect(dtf1).toBe(dtf2);
    });

    it("returns a cached instance for distinct options objects with an identical structure", () => {
      const optionsA: Intl.DateTimeFormatOptions = { year: "numeric", month: "short" };
      const optionsB: Intl.DateTimeFormatOptions = { year: "numeric", month: "short" };
      const dtf1 = getDateTimeFormatter("en-US", optionsA);
      const dtf2 = getDateTimeFormatter("en-US", optionsB);
      expect(dtf1).toBe(dtf2);
    });
  });

  describe("formatAuditTimestamp", () => {
    it("formats a valid ISO timestamp", () => {
      const formatted = formatAuditTimestamp("2026-07-18T14:30:00Z", "en");
      expect(formatted).toContain("2026");
    });

    it("returns the em-dash fallback for null, undefined, or empty timestamp", () => {
      expect(formatAuditTimestamp(null, "en")).toBe("—");
      expect(formatAuditTimestamp(undefined, "en")).toBe("—");
      expect(formatAuditTimestamp("", "en")).toBe("—");
    });

    it("returns the raw string for an unparsable timestamp", () => {
      expect(formatAuditTimestamp("unparsable-timestamp", "en")).toBe("unparsable-timestamp");
    });
  });
});
