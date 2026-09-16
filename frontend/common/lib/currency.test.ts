import { describe, expect, it } from "bun:test";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  formatLockedAmount,
  getCurrencyByCode,
  getCurrencyDisplayName,
  getCurrencyFlag,
  getCurrencyOptionLabel,
  getCurrencyOptions,
  getCurrencySymbol,
  parseCurrencyCode,
} from "./currency";

describe("frontend currency lib", () => {
  describe("parseCurrencyCode", () => {
    it("returns CurrencyCode for valid codes", () => {
      expect(parseCurrencyCode("EGP")).toBe(CurrencyCode.Egp);
      expect(parseCurrencyCode("USD")).toBe(CurrencyCode.Usd);
    });

    it("returns null for invalid or empty inputs", () => {
      expect(parseCurrencyCode(null)).toBeNull();
      expect(parseCurrencyCode(undefined)).toBeNull();
      expect(parseCurrencyCode("INVALID")).toBeNull();
    });
  });

  describe("getCurrencyByCode, getCurrencyFlag, getCurrencySymbol", () => {
    it("resolves catalog entry and properties", () => {
      const egp = getCurrencyByCode("EGP");
      expect(egp?.code).toBe(CurrencyCode.Egp);
      expect(getCurrencyFlag("EGP")).toBe(egp?.flagEmoji ?? "🌐");
      expect(getCurrencySymbol("EGP")).toBe("E£");
      expect(getCurrencySymbol("UNKNOWN")).toBe("UNKNOWN");
      expect(getCurrencyFlag("UNKNOWN")).toBe("🌐");
    });

    it("returns all currency options", () => {
      const options = getCurrencyOptions();
      expect(options.length).toBeGreaterThan(0);
    });
  });

  describe("formatLockedAmount", () => {
    it("formats amounts with locale-aware currency and minor unit decimals", () => {
      const formattedEgp = formatLockedAmount("125.50", CurrencyCode.Egp, "en");
      expect(formattedEgp).toContain("125.50");

      const formattedJpy = formatLockedAmount("1000", CurrencyCode.Jpy, "en");
      expect(formattedJpy).toContain("1,000");

      const formattedKwd = formatLockedAmount("10.5", CurrencyCode.Kwd, "en");
      expect(formattedKwd).toContain("10.500");
    });

    it("returns raw string when amount is not a finite number", () => {
      expect(formatLockedAmount("invalid", CurrencyCode.Usd, "en")).toBe("invalid");
    });
  });

  describe("getCurrencyDisplayName & getCurrencyOptionLabel", () => {
    it("returns localized display names and autocomplete labels", () => {
      const usdName = getCurrencyDisplayName("USD", "en");
      expect(usdName).toBeTruthy();
      expect(getCurrencyOptionLabel("USD", "en")).toContain("(USD)");
    });

    it("falls back gracefully for invalid codes or thrown errors", () => {
      expect(getCurrencyDisplayName("XYZ123", "en")).toBe("XYZ123");
    });
  });
});
