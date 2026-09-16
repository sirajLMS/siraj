import { describe, expect, it } from "bun:test";
import { getLanguageDisplayName } from "./display";

describe("getLanguageDisplayName", () => {
  it("resolves localized language display name", () => {
    const enName = getLanguageDisplayName("en", "en");
    expect(enName).toBe("English");
  });

  it("falls back to code when Intl throws error on invalid tag", () => {
    expect(getLanguageDisplayName("!!!", "en")).toBe("!!!");
  });
});
