import { describe, expect, it } from "bun:test";
import {
  hasRequiredLocalizedValue,
  omitEmptyLocalizedString,
  pickInitialActiveLocale,
  removeLocalizedString,
  resolveLocalizedString,
  setLocalizedString,
  unusedLocales,
} from "@/frontend/common/lib/localized-string";
import { DEFAULT_CONTENT_LOCALE } from "@/shared/types/localized-string";

describe("resolveLocalizedString", () => {
  it("returns empty string for null/undefined", () => {
    expect(resolveLocalizedString(null)).toBe("");
    expect(resolveLocalizedString(undefined)).toBe("");
  });

  it("returns the requested locale value when present", () => {
    expect(resolveLocalizedString({ ar: "عربي", en: "English" }, "en")).toBe("English");
  });

  it("falls back to default locale when requested is empty", () => {
    expect(resolveLocalizedString({ ar: "عربي", en: "" }, "en")).toBe("عربي");
  });

  it("falls back to first available value when default is also empty", () => {
    expect(resolveLocalizedString({ ar: "", en: "English" }, "en")).toBe("English");
  });

  it("returns empty when all values empty", () => {
    expect(resolveLocalizedString({ ar: "", en: "" })).toBe("");
  });
});

describe("setLocalizedString / removeLocalizedString / omitEmptyLocalizedString", () => {
  it("sets a new locale value immutably", () => {
    const out = setLocalizedString({ ar: "عربي" }, "en", "English");
    expect(out).toEqual({ ar: "عربي", en: "English" });
  });

  it("removes a locale entry", () => {
    const out = removeLocalizedString({ ar: "عربي", en: "English" }, "en");
    expect(out).toEqual({ ar: "عربي" });
  });

  it("omits empty entries", () => {
    expect(omitEmptyLocalizedString({ ar: "عربي", en: "" })).toEqual({ ar: "عربي" });
    expect(omitEmptyLocalizedString(null)).toEqual({});
  });
});

describe("hasRequiredLocalizedValue", () => {
  it("returns true when default locale present and required", () => {
    expect(hasRequiredLocalizedValue({ ar: "عربي" }, [DEFAULT_CONTENT_LOCALE])).toBe(true);
  });

  it("returns false when required locale missing", () => {
    expect(hasRequiredLocalizedValue({ en: "English" }, ["ar"])).toBe(false);
  });

  it("returns false when map is empty but locale required", () => {
    expect(hasRequiredLocalizedValue({}, ["ar"])).toBe(false);
  });

  it("returns true when no locales required", () => {
    expect(hasRequiredLocalizedValue({}, [])).toBe(true);
  });
});

describe("pickInitialActiveLocale", () => {
  it("uses UI locale when it is an allowed locale", () => {
    expect(pickInitialActiveLocale("en")).toBe("en");
  });

  it("falls back to default content locale for unknown locale", () => {
    expect(pickInitialActiveLocale("fr")).toBe(DEFAULT_CONTENT_LOCALE);
  });

  it("falls back to default content locale when no arg", () => {
    expect(pickInitialActiveLocale()).toBe(DEFAULT_CONTENT_LOCALE);
  });
});

describe("unusedLocales", () => {
  it("lists locales with no value", () => {
    expect(unusedLocales({ ar: "عربي" })).toEqual(["en"]);
  });

  it("returns empty list when all locales filled", () => {
    expect(unusedLocales({ ar: "عربي", en: "English" })).toEqual([]);
  });
});
