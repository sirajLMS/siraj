import { describe, expect, it } from "bun:test";
import {
  formatAccountingDate,
  formatAccountingMoney,
  formatAccountingMonth,
} from "./accountingFormatters";

describe("accountingFormatters", () => {
  describe("formatAccountingMoney", () => {
    it("returns dash for empty/null/undefined values", () => {
      expect(formatAccountingMoney(null)).toBe("—");
      expect(formatAccountingMoney(undefined)).toBe("—");
      expect(formatAccountingMoney("")).toBe("—");
    });

    it("formats numbers with grouping and 2 decimal places", () => {
      expect(formatAccountingMoney(25000)).toBe("25,000.00");
      expect(formatAccountingMoney(1234.5)).toBe("1,234.50");
      expect(formatAccountingMoney("1000")).toBe("1,000.00");
      expect(formatAccountingMoney(0)).toBe("0.00");
    });

    it("returns original string for invalid numeric strings", () => {
      expect(formatAccountingMoney("invalid")).toBe("invalid");
    });
  });

  describe("formatAccountingDate", () => {
    it("returns dash for null/undefined/empty string", () => {
      expect(formatAccountingDate(null, "en")).toBe("—");
      expect(formatAccountingDate(undefined, "en")).toBe("—");
      expect(formatAccountingDate("", "en")).toBe("—");
    });

    it("formats valid date string in english and arabic locales", () => {
      const formattedEn = formatAccountingDate("2026-09-15T00:00:00.000Z", "en");
      expect(formattedEn).toContain("2026");
      expect(formattedEn).toContain("Sep");

      const formattedAr = formatAccountingDate("2026-09-15T00:00:00.000Z", "ar");
      expect(formattedAr).toBeTypeOf("string");
      expect(formattedAr.length).toBeGreaterThan(0);
    });

    it("returns raw value for invalid date input", () => {
      expect(formatAccountingDate("not-a-date", "en")).toBe("not-a-date");
    });
  });

  describe("formatAccountingMonth", () => {
    it("returns dash for null/undefined/empty string", () => {
      expect(formatAccountingMonth(null, "en")).toBe("—");
      expect(formatAccountingMonth(undefined, "en")).toBe("—");
      expect(formatAccountingMonth("", "en")).toBe("—");
    });

    it("formats YYYY-MM month string in english and arabic locales", () => {
      const formattedEn = formatAccountingMonth("2026-09", "en");
      expect(formattedEn).toContain("2026");
      expect(formattedEn).toContain("Sep");

      const formattedAr = formatAccountingMonth("2026-09", "ar");
      expect(formattedAr).toBeTypeOf("string");
      expect(formattedAr.length).toBeGreaterThan(0);
    });

    it("returns raw value for invalid month string format", () => {
      expect(formatAccountingMonth("invalid-month", "en")).toBe("invalid-month");
    });
  });
});
