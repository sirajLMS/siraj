import { describe, expect, test } from "bun:test";
import { safeParseCurrencyCode } from "@/backend/lib/currency.validation";
import { CurrencyCode } from "@/shared/constants/currency.enum";

describe("safeParseCurrencyCode", () => {
  describe("valid inputs", () => {
    test("returns CurrencyCode for every valid CurrencyCode enum value", () => {
      for (const code of Object.values(CurrencyCode)) {
        expect(safeParseCurrencyCode(code)).toBe(code);
      }
    });

    test("returns CurrencyCode for valid currency code strings", () => {
      expect(safeParseCurrencyCode("EGP")).toBe(CurrencyCode.EGP);
      expect(safeParseCurrencyCode("USD")).toBe(CurrencyCode.USD);
      expect(safeParseCurrencyCode("SAR")).toBe(CurrencyCode.SAR);
      expect(safeParseCurrencyCode("EUR")).toBe(CurrencyCode.EUR);
    });
  });

  describe("invalid string inputs", () => {
    test("returns null for unknown currency codes", () => {
      expect(safeParseCurrencyCode("XYZ")).toBeNull();
      expect(safeParseCurrencyCode("INVALID")).toBeNull();
      expect(safeParseCurrencyCode("BTC")).toBeNull();
    });

    test("returns null for lowercase or mixed-case currency strings", () => {
      expect(safeParseCurrencyCode("usd")).toBeNull();
      expect(safeParseCurrencyCode("egp")).toBeNull();
      expect(safeParseCurrencyCode("Egp")).toBeNull();
    });

    test("returns null for strings with leading or trailing whitespace", () => {
      expect(safeParseCurrencyCode(" USD")).toBeNull();
      expect(safeParseCurrencyCode("EGP ")).toBeNull();
      expect(safeParseCurrencyCode(" EUR ")).toBeNull();
    });

    test("returns null for empty or whitespace-only strings", () => {
      expect(safeParseCurrencyCode("")).toBeNull();
      expect(safeParseCurrencyCode("   ")).toBeNull();
    });
  });

  describe("non-string inputs", () => {
    test("returns null for null and undefined", () => {
      expect(safeParseCurrencyCode(null)).toBeNull();
      expect(safeParseCurrencyCode(undefined)).toBeNull();
    });

    test("returns null for numeric values", () => {
      expect(safeParseCurrencyCode(840)).toBeNull();
      expect(safeParseCurrencyCode(0)).toBeNull();
      expect(safeParseCurrencyCode(NaN)).toBeNull();
    });

    test("returns null for boolean values", () => {
      expect(safeParseCurrencyCode(true)).toBeNull();
      expect(safeParseCurrencyCode(false)).toBeNull();
    });

    test("returns null for objects and arrays", () => {
      expect(safeParseCurrencyCode({ code: "USD" })).toBeNull();
      expect(safeParseCurrencyCode({})).toBeNull();
      expect(safeParseCurrencyCode(["USD"])).toBeNull();
      expect(safeParseCurrencyCode([])).toBeNull();
    });

    test("returns null for functions and symbols", () => {
      expect(safeParseCurrencyCode(() => "USD")).toBeNull();
      expect(safeParseCurrencyCode(Symbol("USD"))).toBeNull();
    });
  });
});
