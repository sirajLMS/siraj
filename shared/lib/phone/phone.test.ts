import { describe, expect, test } from "bun:test";
import {
  buildE164FromParts,
  canAppendCallingCodeDigit,
  formatNationalDigits,
  formatPhoneDisplay,
  getCallingCodeForRegion,
  getMaxCallingCodeLength,
  isCallingCodeComplete,
  isCallingCodePrefixValid,
  isCompletePhoneValid,
  isPhoneValidForRegion,
  maskPhone,
  matchCallingCodeFromDigits,
  parsePhoneToE164,
  splitPhoneValueToParts,
} from "@/shared/lib/phone";

describe("phone utilities", () => {
  describe("parsePhoneToE164", () => {
    test("parses Egypt number to E.164", () => {
      const result = parsePhoneToE164("+201012345678");
      expect(result.valid).toBe(true);
      expect(result.e164).toBe("+201012345678");
    });

    test("uses default region for local numbers", () => {
      const result = parsePhoneToE164("01012345678", "EG");
      expect(result.valid).toBe(true);
      expect(result.e164).toBe("+201012345678");
    });

    test("returns invalid for empty input", () => {
      expect(parsePhoneToE164("")).toEqual({ e164: null, valid: false });
    });

    test("returns invalid for malformed number", () => {
      const result = parsePhoneToE164("+201");
      expect(result.valid).toBe(false);
      expect(result.e164).toBeNull();
    });
  });

  describe("calling code helpers", () => {
    test("resolves Egypt calling code", () => {
      expect(getCallingCodeForRegion("EG")).toBe("20");
    });

    test("matches partial prefix while typing", () => {
      const match = matchCallingCodeFromDigits("96", "SA");
      expect(match?.isComplete).toBe(false);
      expect(match?.callingCode).toBe("966");
    });

    test("marks complete calling code", () => {
      expect(isCallingCodeComplete("966")).toBe(true);
      expect(isCallingCodePrefixValid("96")).toBe(true);
      expect(isCallingCodePrefixValid("999")).toBe(false);
    });

    test("resolves +1 to US when default region is unrelated", () => {
      const match = matchCallingCodeFromDigits("1", "EG");
      expect(match).toEqual({ region: "US", callingCode: "1", isComplete: true });
    });

    test("reports max calling code length", () => {
      expect(getMaxCallingCodeLength()).toBeGreaterThanOrEqual(3);
    });

    test("blocks digits once calling code is complete", () => {
      expect(canAppendCallingCodeDigit("966", "5")).toBe(false);
    });

    test("blocks digits that exceed max calling code length", () => {
      const maxLength = getMaxCallingCodeLength();
      const tooLong = "1".repeat(maxLength + 1);
      expect(isCallingCodePrefixValid(tooLong)).toBe(false);
      expect(canAppendCallingCodeDigit("1".repeat(maxLength), "2")).toBe(false);
    });

    test("allows valid partial calling code digits", () => {
      expect(canAppendCallingCodeDigit("9", "6")).toBe(true);
      expect(canAppendCallingCodeDigit("96", "6")).toBe(true);
    });
  });

  describe("buildE164FromParts", () => {
    test("builds E.164 from prefix and national digits", () => {
      expect(buildE164FromParts("966", "501234567")).toBe("+966501234567");
    });
  });

  describe("splitPhoneValueToParts", () => {
    test("splits complete E.164", () => {
      expect(splitPhoneValueToParts("+201012345678")).toEqual({
        prefixDigits: "20",
        nationalDigits: "1012345678",
        region: "EG",
      });
    });

    test("splits partial prefix while typing", () => {
      const result = splitPhoneValueToParts("+9");
      expect(result.prefixDigits).toBe("9");
      expect(result.nationalDigits).toBe("");
      expect(result.region).toBeTruthy();
    });

    test("splits prefix-only value from country selection", () => {
      expect(splitPhoneValueToParts("+20", "EG")).toEqual({
        prefixDigits: "20",
        nationalDigits: "",
        region: "EG",
      });
    });

    test("splits +1 prefix to US", () => {
      expect(splitPhoneValueToParts("+1", "EG")).toEqual({
        prefixDigits: "1",
        nationalDigits: "",
        region: "US",
      });
    });

    test("splits prefix with partial national digits", () => {
      expect(splitPhoneValueToParts("+966501", "SA")).toEqual({
        prefixDigits: "966",
        nationalDigits: "501",
        region: "SA",
      });
    });
  });

  describe("formatPhoneDisplay", () => {
    test("formats Egypt number nationally by default", () => {
      const formatted = formatPhoneDisplay("+201012345678");
      expect(formatted).toContain("10");
    });
  });

  describe("maskPhone", () => {
    test("masks middle digits", () => {
      const masked = maskPhone("+201012345678", "EG");
      expect(masked).toContain("•••");
      expect(masked).toContain("5678");
      expect(masked).not.toContain("101234");
    });
  });

  describe("formatNationalDigits", () => {
    test("applies regional formatting template", () => {
      const formatted = formatNationalDigits("1012345678", "EG");
      expect(formatted.replace(/\D/g, "")).toBe("1012345678");
    });
  });

  describe("isCompletePhoneValid", () => {
    test("returns false for prefix only", () => {
      expect(isCompletePhoneValid("20", "", "EG", "EG")).toBe(false);
    });

    test("returns false for incomplete national number", () => {
      expect(isCompletePhoneValid("20", "10123", "EG", "EG")).toBe(false);
    });

    test("returns true for complete valid Egypt number", () => {
      expect(isCompletePhoneValid("20", "1012345678", "EG", "EG")).toBe(true);
    });

    test("returns false for wrong region", () => {
      expect(isCompletePhoneValid("966", "501234567", "EG", "EG")).toBe(false);
    });
  });

  describe("isPhoneValidForRegion", () => {
    test("validates number for region", () => {
      expect(isPhoneValidForRegion("+201012345678", "EG")).toBe(true);
      expect(isPhoneValidForRegion("+966501234567", "EG")).toBe(false);
    });
  });
});
