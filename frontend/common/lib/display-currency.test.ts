import { describe, expect, it } from "bun:test";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { formatLockedAmount, getCurrencyDisplayName, parseCurrencyCode } from "@/frontend/common/lib/currency";
import { getCountryDisplayName } from "@/frontend/common/lib/locale/country/display";
import { getLanguageDisplayName } from "@/frontend/common/lib/locale/language/display";

describe("display & currency helpers optimization tests", () => {
  describe("getCountryDisplayName", () => {
    it("returns correct country display names", () => {
      expect(getCountryDisplayName("EG", "en")).toBe("Egypt");
      expect(getCountryDisplayName("US", "en")).toBe("United States");
    });

    it("falls back gracefully for unknown or invalid country codes", () => {
      expect(getCountryDisplayName("UNKNOWN_CODE", "en")).toBe("UNKNOWN_CODE");
    });
  });

  describe("getLanguageDisplayName", () => {
    it("returns correct language display names", () => {
      expect(getLanguageDisplayName("ar", "en")).toBe("Arabic");
      expect(getLanguageDisplayName("en", "en")).toBe("English");
    });

    it("handles language codes gracefully", () => {
      expect(getLanguageDisplayName("xyz", "en")).toBe("xyz");
    });
  });

  describe("getCurrencyDisplayName & parseCurrencyCode", () => {
    it("returns currency display name correctly", () => {
      expect(getCurrencyDisplayName(CurrencyCode.Egp, "en")).toContain("Egyptian");
      expect(getCurrencyDisplayName(CurrencyCode.Usd, "en")).toContain("US Dollar");
    });

    it("parses valid currency codes with parseCurrencyCode", () => {
      expect(parseCurrencyCode("EGP")).toBe(CurrencyCode.Egp);
      expect(parseCurrencyCode("USD")).toBe(CurrencyCode.Usd);
      expect(parseCurrencyCode("INVALID")).toBeNull();
      expect(parseCurrencyCode(null)).toBeNull();
    });
  });

  describe("formatLockedAmount", () => {
    it("formats currency amounts using cached NumberFormat", () => {
      const formattedEgp = formatLockedAmount("100.50", CurrencyCode.Egp, "en");
      expect(formattedEgp).toContain("100.50");

      const formattedJpy = formatLockedAmount("1000", CurrencyCode.Jpy, "en");
      expect(formattedJpy).toContain("1,000");
    });

    it("handles invalid non-numeric inputs by returning raw amount", () => {
      expect(formatLockedAmount("invalid", CurrencyCode.Egp, "en")).toBe("invalid");
    });
  });
});
