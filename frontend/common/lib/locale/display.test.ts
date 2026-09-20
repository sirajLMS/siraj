import { describe, expect, test } from "bun:test";
import { getCountryDisplayName } from "./country/display";
import { getLanguageDisplayName } from "./language/display";

describe("locale display helpers", () => {
  test("getCountryDisplayName returns localized country display name", () => {
    expect(getCountryDisplayName("US", "en")).toBe("United States");
    expect(getCountryDisplayName("INVALID", "en")).toBe("INVALID");
  });

  test("getLanguageDisplayName returns localized language display name", () => {
    expect(getLanguageDisplayName("en", "en")).toBe("English");
    expect(getLanguageDisplayName("ar", "en")).toBe("Arabic");
  });
});
