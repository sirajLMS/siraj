import { describe, expect, test } from "bun:test";
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

describe("currency helpers", () => {
  describe("parseCurrencyCode", () => {
    test("parses valid currency codes", () => {
      expect(parseCurrencyCode("EGP")).toBe(CurrencyCode.Egp);
      expect(parseCurrencyCode("USD")).toBe(CurrencyCode.Usd);
      expect(parseCurrencyCode("SAR")).toBe(CurrencyCode.Sar);
    });

    test("returns null for invalid inputs", () => {
      expect(parseCurrencyCode("INVALID")).toBeNull();
      expect(parseCurrencyCode(null)).toBeNull();
      expect(parseCurrencyCode(undefined)).toBeNull();
    });
  });

  describe("getCurrencyByCode", () => {
    test("returns CurrencyOption for known code", () => {
      const option = getCurrencyByCode(CurrencyCode.Egp);
      expect(option).toBeDefined();
      expect(option?.symbol).toBe("E£");
      expect(option?.countryCode).toBe("EG");
    });

    test("returns undefined for unknown code", () => {
      expect(getCurrencyByCode("XYZ")).toBeUndefined();
    });
  });

  describe("getCurrencyFlag and getCurrencySymbol", () => {
    test("resolves flag emoji and symbol glyphs", () => {
      expect(getCurrencySymbol(CurrencyCode.Usd)).toBe("$");
      expect(getCurrencyFlag(CurrencyCode.Egp)).not.toBe("🌐");
      expect(getCurrencyFlag("XYZ")).toBe("🌐");
      expect(getCurrencySymbol("XYZ")).toBe("XYZ");
    });
  });

  describe("getCurrencyDisplayName", () => {
    test("returns localized display names", () => {
      expect(getCurrencyDisplayName("USD", "en")).toBe("US Dollar");
      expect(getCurrencyDisplayName("EUR", "en")).toBe("Euro");
    });

    test("handles fallback for unknown codes", () => {
      expect(getCurrencyDisplayName("UNKNOWN", "en")).toBe("UNKNOWN");
    });
  });

  describe("formatLockedAmount", () => {
    test("formats amounts with correct minor-unit decimals", () => {
      expect(formatLockedAmount("100", CurrencyCode.Usd, "en")).toBe("$100.00");
      expect(formatLockedAmount("100", CurrencyCode.Jpy, "en")).toBe("¥100");
      expect(formatLockedAmount("100", CurrencyCode.Kwd, "en")).toBe("KWD 100.000");
    });

    test("returns raw string if non-numeric", () => {
      expect(formatLockedAmount("not-a-number", CurrencyCode.Usd, "en")).toBe("not-a-number");
    });
  });

  describe("getCurrencyOptions and getCurrencyOptionLabel", () => {
    test("returns currency option list and labels", () => {
      const options = getCurrencyOptions();
      expect(options.length).toBeGreaterThan(0);
      expect(getCurrencyOptionLabel(CurrencyCode.Usd, "en")).toBe("US Dollar (USD)");
    });
  });
});
