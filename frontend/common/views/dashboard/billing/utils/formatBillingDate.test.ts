import { describe, expect, it } from "bun:test";
import {
  formatBillingDate,
  formatBillingMonth,
} from "@/frontend/common/views/dashboard/billing/utils/formatBillingDate";

describe("formatBillingDate", () => {
  describe("formatBillingDate", () => {
    it("returns empty string for null, undefined, or empty dateStr", () => {
      expect(formatBillingDate(null, "en")).toBe("");
      expect(formatBillingDate(undefined, "en")).toBe("");
      expect(formatBillingDate("", "en")).toBe("");
    });

    it("returns raw dateStr for invalid dates", () => {
      expect(formatBillingDate("invalid-date", "en")).toBe("invalid-date");
    });

    it("formats valid date string for English and Arabic locales", () => {
      const formattedEn = formatBillingDate("2026-09-08", "en");
      expect(formattedEn).toContain("2026");
      expect(formattedEn).toContain("Sep");

      const formattedAr = formatBillingDate("2026-09-08", "ar");
      expect(formattedAr.length).toBeGreaterThan(0);
    });
  });

  describe("formatBillingMonth", () => {
    it("returns empty string for null, undefined, or empty dateStr", () => {
      expect(formatBillingMonth(null, "en")).toBe("");
      expect(formatBillingMonth(undefined, "en")).toBe("");
      expect(formatBillingMonth("", "en")).toBe("");
    });

    it("returns raw dateStr for invalid dates", () => {
      expect(formatBillingMonth("invalid-date", "en")).toBe("invalid-date");
    });

    it("formats valid month string for English locale", () => {
      const formatted = formatBillingMonth("2026-09-08", "en");
      expect(formatted).toBe("September");
    });
  });
});
