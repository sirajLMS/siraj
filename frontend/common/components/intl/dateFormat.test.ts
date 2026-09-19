import { describe, expect, it } from "bun:test";
import { formatDate, formatDateInput, formatDateTime, formatMonthYear, formatTime, parseDateInput } from "@/frontend/common/components/intl/dateFormat";

describe("dateFormat", () => {
  describe("parseDateInput", () => {
    it("returns null for null or undefined", () => {
      expect(parseDateInput(null)).toBeNull();
      expect(parseDateInput(undefined)).toBeNull();
    });

    it("parses Date instances", () => {
      const d = new Date("2026-07-18T10:00:00Z");
      expect(parseDateInput(d)).toEqual(d);
      expect(parseDateInput(new Date(NaN))).toBeNull();
    });

    it("parses numbers (epoch timestamps)", () => {
      const ts = 1700000000000;
      expect(parseDateInput(ts)).toEqual(new Date(ts));
      expect(parseDateInput(NaN)).toBeNull();
    });

    it("parses valid date strings", () => {
      expect(parseDateInput("2026-07-18")).toBeInstanceOf(Date);
      expect(parseDateInput("invalid date")).toBeNull();
      expect(parseDateInput("   ")).toBeNull();
    });
  });

  describe("formatDateInput", () => {
    it("formats Date as YYYY-MM-DD", () => {
      const d = new Date(2026, 6, 18);
      expect(formatDateInput(d)).toBe("2026-07-18");
    });

    it("returns empty string for null/invalid date", () => {
      expect(formatDateInput(null)).toBe("");
      expect(formatDateInput(new Date(NaN))).toBe("");
    });
  });

  describe("formatDate", () => {
    it("formats date with default fallback", () => {
      const d = new Date(2026, 6, 18);
      const formatted = formatDate(d, "en");
      expect(formatted).toContain("2026");
      expect(formatted).toContain("Jul");
    });

    it("uses fallback for invalid dates", () => {
      expect(formatDate(null, "en")).toBe("—");
      expect(formatDate(null, "en", "N/A")).toBe("N/A");
      expect(formatDate("non-empty string", "en", "—")).toBe("non-empty string");
    });
  });

  describe("formatDateTime", () => {
    it("formats date and time", () => {
      const d = new Date(2026, 6, 18, 13, 20);
      const formatted = formatDateTime(d, "en");
      expect(formatted).toContain("2026");
      expect(formatted).toContain("Jul");
    });
  });

  describe("formatTime", () => {
    it("formats time", () => {
      const d = new Date(2026, 6, 18, 13, 20);
      const formatted = formatTime(d, "en");
      expect(formatted).toMatch(/1?:?20/);
    });
  });

  describe("formatMonthYear", () => {
    it("formats month and year", () => {
      const d = new Date(2026, 6, 18);
      const formatted = formatMonthYear(d, "en");
      expect(formatted).toContain("July");
      expect(formatted).toContain("2026");
    });

    it("throws RangeError on invalid date", () => {
      expect(() => formatMonthYear("invalid date", "en")).toThrow(RangeError);
    });
  });
});
