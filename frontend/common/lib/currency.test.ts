import { describe, expect, test } from "bun:test";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  formatLockedAmount,
  getCurrencyByCode,
  getCurrencyDisplayName,
  getCurrencyFlag,
  getCurrencyOptionLabel,
  getCurrencySymbol,
  parseCurrencyCode,
} from "./currency";

describe("currency helpers", () => {
  test("getCurrencyByCode returns catalog entry for valid code", () => {
    const option = getCurrencyByCode(CurrencyCode.Usd);
    expect(option).toBeDefined();
    expect(option?.code).toBe(CurrencyCode.Usd);
    expect(option?.symbol).toBe("$");
  });

  test("getCurrencyFlag returns flag or fallback globe", () => {
    expect(getCurrencyFlag(CurrencyCode.Usd)).toBe("🇺🇸");
    expect(getCurrencyFlag("INVALID")).toBe("🌐");
  });

  test("getCurrencySymbol returns symbol or fallback code", () => {
    expect(getCurrencySymbol(CurrencyCode.Usd)).toBe("$");
    expect(getCurrencySymbol("INVALID")).toBe("INVALID");
  });

  test("parseCurrencyCode validates currency code", () => {
    expect(parseCurrencyCode(CurrencyCode.Usd)).toBe(CurrencyCode.Usd);
    expect(parseCurrencyCode("INVALID")).toBeNull();
    expect(parseCurrencyCode(null)).toBeNull();
  });

  test("formatLockedAmount formats monetary amounts correctly and reuses cached formatters", () => {
    const formatted = formatLockedAmount("1234.56", CurrencyCode.Usd, "en");
    expect(formatted).toContain("1,234.56");

    const formattedJpy = formatLockedAmount("1234", CurrencyCode.Jpy, "en");
    expect(formattedJpy).toContain("1,234");
  });

  test("getCurrencyDisplayName returns localized currency name", () => {
    expect(getCurrencyDisplayName(CurrencyCode.Usd, "en")).toContain("US Dollar");
    expect(getCurrencyDisplayName("INVALID", "en")).toBe("INVALID");
  });

  test("getCurrencyOptionLabel formats option label with code", () => {
    const label = getCurrencyOptionLabel(CurrencyCode.Usd, "en");
    expect(label).toContain("US Dollar");
    expect(label).toContain("(USD)");
  });
});
