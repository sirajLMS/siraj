import { describe, expect, it } from "bun:test";
import { getCountryDisplayName } from "./display";

describe("getCountryDisplayName", () => {
  it("resolves localized country display name", () => {
    const usName = getCountryDisplayName("US", "en");
    expect(usName).toBe("United States");
  });

  it("falls back to code on invalid input or error", () => {
    expect(getCountryDisplayName("INVALID", "en")).toBe("INVALID");
  });
});
