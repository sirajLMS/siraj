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
} from "./accountingFormatters";

describe("accountingFormatters", () => {
  describe("formatAccountingMoney", () => {
    it("formats numbers and numeric strings with 2 decimal places and thousands separators", () => {
      expect(formatAccountingMoney(25000)).toBe("25,000.00");
      expect(formatAccountingMoney("1234567.89")).toBe("1,234,567.89");
      expect(formatAccountingMoney(0)).toBe("0.00");
    });

    it("handles empty, null, undefined, and non-numeric inputs gracefully", () => {
      expect(formatAccountingMoney(null)).toBe("—");
      expect(formatAccountingMoney(undefined)).toBe("—");
      expect(formatAccountingMoney("")).toBe("—");
      expect(formatAccountingMoney("abc")).toBe("abc");
    });
  });

  describe("numericCell", () => {
    it("coerces numbers and numeric strings to finite numbers", () => {
      expect(numericCell(100)).toBe(100);
      expect(numericCell("42.5")).toBe(42.5);
      expect(numericCell(Number.NaN)).toBe(0);
      expect(numericCell("invalid")).toBe(0);
      expect(numericCell(null)).toBe(0);
    });
  });

  describe("textCell", () => {
    it("coerces strings, numbers, and booleans into text strings with fallback", () => {
      expect(textCell("hello")).toBe("hello");
      expect(textCell(123)).toBe("123");
      expect(textCell(true)).toBe("true");
      expect(textCell(null)).toBe("—");
      expect(textCell(undefined, "N/A")).toBe("N/A");
    });
  });

  describe("dateCell", () => {
    it("converts Date objects and string inputs into ISO string or passes through string", () => {
      const d = new Date("2026-09-10T12:00:00Z");
      expect(dateCell(d)).toBe(d.toISOString());
      expect(dateCell("2026-09-10")).toBe("2026-09-10");
      expect(dateCell(new Date(Number.NaN))).toBeNull();
      expect(dateCell(123)).toBeNull();
    });
  });

  describe("formatAccountingDate", () => {
    it("formats valid ISO strings according to locale", () => {
      const formattedEn = formatAccountingDate("2026-09-10T00:00:00Z", "en");
      expect(formattedEn).toContain("2026");
      expect(formattedEn).toContain("Sep");

      const formattedAr = formatAccountingDate("2026-09-10T00:00:00Z", "ar");
      expect(formattedAr).toBeDefined();
    });

    it("returns placeholder or raw value for invalid or missing dates", () => {
      expect(formatAccountingDate(null, "en")).toBe("—");
      expect(formatAccountingDate("", "en")).toBe("—");
      expect(formatAccountingDate("invalid-date", "en")).toBe("invalid-date");
    });
  });

  describe("formatAccountingMonth", () => {
    it("formats YYYY-MM strings correctly according to locale", () => {
      const formattedEn = formatAccountingMonth("2026-09", "en");
      expect(formattedEn).toContain("2026");
      expect(formattedEn).toContain("Sep");

      const formattedAr = formatAccountingMonth("2026-09", "ar");
      expect(formattedAr).toBeDefined();
    });

    it("returns placeholder or raw value for invalid or missing months", () => {
      expect(formatAccountingMonth(null, "en")).toBe("—");
      expect(formatAccountingMonth("", "en")).toBe("—");
      expect(formatAccountingMonth("2026", "en")).toBe("2026");
    });
  });

  describe("paymentGatewayLabel", () => {
    it("returns gateway label or dash fallback", () => {
      const gatewaysMap = {
        [PaymentGateway.Bank]: "Bank Transfer",
        [PaymentGateway.Paypal]: "PayPal Gateway",
        [PaymentGateway.None]: "None",
        [PaymentGateway.Other]: "Other Gateway",
        [PaymentGateway.WesternUnion]: "Western Union",
      };

      expect(paymentGatewayLabel(PaymentGateway.Paypal, gatewaysMap)).toBe("PayPal Gateway");
      expect(paymentGatewayLabel(PaymentGateway.None, gatewaysMap)).toBe("—");
      expect(paymentGatewayLabel(null, gatewaysMap)).toBe("—");
    });
  });
});
