import { describe, expect, it } from "bun:test";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  currencies,
  getCurrencyByCode,
  getCurrencyFlag,
  getCurrencySymbol,
} from "@/frontend/common/lib/currency";
import {
  countries,
  getCountryByCode,
  getCountryEmoji,
} from "@/frontend/common/lib/locale/country";
import {
  getLanguageByCode,
  languages,
} from "@/frontend/common/lib/locale/language";

describe("catalog lookup optimizations", () => {
  describe("country lookups", () => {
    it("returns correct CountryType for valid country codes", () => {
      for (const country of countries) {
        const result = getCountryByCode(country.code);
        expect(result).toBe(country);
      }
    });

    it("returns undefined for invalid country codes", () => {
      expect(getCountryByCode("XX")).toBeUndefined();
      expect(getCountryByCode("")).toBeUndefined();
    });

    it("returns correct country flag emoji", () => {
      expect(getCountryEmoji("SA")).toBe("🇸🇦");
      expect(getCountryEmoji("EG")).toBe("🇪🇬");
      expect(getCountryEmoji("")).toBe("🌐");
    });
  });

  describe("language lookups", () => {
    it("returns correct LanguageType for valid language codes", () => {
      for (const language of languages) {
        const result = getLanguageByCode(language.code);
        expect(result).toBe(language);
      }
    });

    it("returns undefined for invalid language codes", () => {
      expect(getLanguageByCode("xx_XX")).toBeUndefined();
      expect(getLanguageByCode("")).toBeUndefined();
    });
  });

  describe("currency lookups", () => {
    it("returns correct CurrencyOption for valid currency codes", () => {
      for (const currency of currencies) {
        const result = getCurrencyByCode(currency.code);
        expect(result).toBe(currency);
      }
    });

    it("returns undefined for invalid currency codes", () => {
      expect(getCurrencyByCode("XYZ")).toBeUndefined();
      expect(getCurrencyByCode("")).toBeUndefined();
    });

    it("resolves flag and symbol correctly", () => {
      expect(getCurrencyFlag(CurrencyCode.Usd)).toBe("🇺🇸");
      expect(getCurrencySymbol(CurrencyCode.Usd)).toBe("$");
      expect(getCurrencySymbol("UNKNOWN")).toBe("UNKNOWN");
    });
  });
});
