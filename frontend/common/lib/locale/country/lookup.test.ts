import { describe, expect, it } from "bun:test";
import { CountryCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { getCountryByCode, getCountryEmoji } from "@/frontend/common/lib/locale";

describe("country lookup performance and correctness", () => {
  it("looks up country by code correctly in O(1)", () => {
    const eg = getCountryByCode("EG");
    expect(eg).toBeDefined();
    expect(eg?.code).toBe(CountryCode.Eg);
    expect(eg?.phone).toBe("20");

    const sa = getCountryByCode("SA");
    expect(sa?.code).toBe(CountryCode.Sa);

    const lowercase = getCountryByCode("eg");
    expect(lowercase?.code).toBe(CountryCode.Eg);
  });

  it("returns undefined for unknown country codes", () => {
    expect(getCountryByCode("XX")).toBeUndefined();
    expect(getCountryByCode("")).toBeUndefined();
  });

  it("resolves flag emojis correctly in O(1)", () => {
    expect(getCountryEmoji("EG")).toBe("🇪🇬");
    expect(getCountryEmoji("SA")).toBe("🇸🇦");
    expect(getCountryEmoji("")).toBe("🌐");
  });
});
