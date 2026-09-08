import { describe, expect, it } from "bun:test";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { getCurrencyByCode, getCurrencyFlag, getCurrencySymbol } from "@/frontend/common/lib/currency";

describe("currency lookup performance and correctness", () => {
  it("looks up currency by enum or code correctly in O(1)", () => {
    const usd = getCurrencyByCode(CurrencyCode.Usd);
    expect(usd).toBeDefined();
    expect(usd?.symbol).toBe("$");
    expect(usd?.countryCode).toBe("US");

    const egp = getCurrencyByCode("EGP");
    expect(egp?.symbol).toBe("E£");
  });

  it("returns undefined for unknown currency codes", () => {
    expect(getCurrencyByCode("INVALID")).toBeUndefined();
    expect(getCurrencyByCode("")).toBeUndefined();
  });

  it("resolves flag and symbol correctly", () => {
    expect(getCurrencyFlag(CurrencyCode.Usd)).toBe("🇺🇸");
    expect(getCurrencyFlag("UNKNOWN")).toBe("🌐");

    expect(getCurrencySymbol(CurrencyCode.Usd)).toBe("$");
    expect(getCurrencySymbol("UNKNOWN")).toBe("UNKNOWN");
  });
});
