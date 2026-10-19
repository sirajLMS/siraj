import { describe, expect, it } from "bun:test";
import { PaymentGateway } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  dateCell,
  formatAccountingDate,
  formatAccountingMoney,
  formatAccountingMonth,
  numericCell,
  paymentGatewayLabel,
  textCell,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";

describe("accountingFormatters", () => {
  describe("formatAccountingMoney", () => {
    it("returns dash for empty, null, or undefined values", () => {
      expect(formatAccountingMoney(null)).toBe("—");
      expect(formatAccountingMoney(undefined)).toBe("—");
      expect(formatAccountingMoney("")).toBe("—");
    });

    it("returns original string if value is not a valid number", () => {
      expect(formatAccountingMoney("invalid")).toBe("invalid");
    });

    it("formats numbers and string numbers with commas and 2 decimals", () => {
      expect(formatAccountingMoney(25000)).toBe("25,000.00");
      expect(formatAccountingMoney("1234567.8")).toBe("1,234,567.80");
      expect(formatAccountingMoney(0)).toBe("0.00");
    });
  });

  describe("formatAccountingDate", () => {
    it("returns dash for empty or null dates", () => {
      expect(formatAccountingDate(null, "en")).toBe("—");
      expect(formatAccountingDate("", "en")).toBe("—");
      expect(formatAccountingDate(undefined, "en")).toBe("—");
    });

    it("returns raw value for invalid date strings", () => {
      expect(formatAccountingDate("not-a-date", "en")).toBe("not-a-date");
    });

    it("formats valid dates for English and Arabic locales", () => {
      const formattedEn = formatAccountingDate("2026-09-08T12:00:00Z", "en");
      expect(formattedEn).toContain("2026");
      expect(formattedEn).toContain("Sep");

      const formattedAr = formatAccountingDate("2026-09-08T12:00:00Z", "ar");
      expect(formattedAr.length).toBeGreaterThan(0);
      expect(formattedAr).toContain("سبتمبر");
    });
  });

  describe("formatAccountingMonth", () => {
    it("returns dash for empty or null months", () => {
      expect(formatAccountingMonth(null, "en")).toBe("—");
      expect(formatAccountingMonth("", "en")).toBe("—");
    });

    it("returns raw value for invalid YYYY-MM inputs", () => {
      expect(formatAccountingMonth("invalid-month", "en")).toBe("invalid-month");
    });

    it("formats valid YYYY-MM string for English locale", () => {
      const formatted = formatAccountingMonth("2026-09", "en");
      expect(formatted).toContain("2026");
      expect(formatted).toContain("Sep");
    });
  });

  describe("numericCell", () => {
    it("coerces values safely to numbers", () => {
      expect(numericCell(123.45)).toBeCloseTo(123.45);
      expect(numericCell("123.45")).toBeCloseTo(123.45);
      expect(numericCell("invalid")).toBe(0);
      expect(numericCell(null)).toBe(0);
      expect(numericCell(Number.NaN)).toBe(0);
    });
  });

  describe("textCell", () => {
    it("coerces values safely to text or fallback", () => {
      expect(textCell("hello")).toBe("hello");
      expect(textCell(100)).toBe("100");
      expect(textCell(true)).toBe("true");
      expect(textCell(null, "fallback")).toBe("fallback");
    });
  });

  describe("dateCell", () => {
    it("coerces Date instances and strings to ISO strings or null", () => {
      const d = new Date("2026-01-01T00:00:00Z");
      expect(dateCell(d)).toBe(d.toISOString());
      expect(dateCell("2026-01-01")).toBe("2026-01-01");
      expect(dateCell(null)).toBeNull();
      expect(dateCell(new Date("invalid"))).toBeNull();
    });
  });

  describe("paymentGatewayLabel", () => {
    it("returns dash for null/none or mapped gateway label", () => {
      const labels = {
        [PaymentGateway.Bank]: "Bank Label",
        [PaymentGateway.Paypal]: "PayPal Label",
        [PaymentGateway.WesternUnion]: "Western Union Label",
        [PaymentGateway.Other]: "Other Label",
        [PaymentGateway.None]: "None Label",
      };
      expect(paymentGatewayLabel(null, labels)).toBe("—");
      expect(paymentGatewayLabel(PaymentGateway.None, labels)).toBe("—");
      expect(paymentGatewayLabel(PaymentGateway.Paypal, labels)).toBe("PayPal Label");
    });
  });
});
