import { describe, expect, test } from "bun:test";
import {
  isValidEgyptianNationalId,
  isValidNationalId,
  isValidNationalIdForCountry,
  NATIONAL_ID_MAX_LENGTH,
  parseNationalId,
  serializeNationalId,
} from "@/shared/lib/national-id";

/**
 * Compute the weighted mod-11 check digit for a 13-digit payload (Egyptian ID).
 * Weights [2,7,6,5,4,3,2,7,6,5,4,3,2]; remainder 0 -> 0, remainder 1 -> 10
 * (invalid as a single digit).
 */
function checksumDigit(payload: string): number {
  const weights = [2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = payload
    .split("")
    .map(Number)
    .reduce((acc, d, i) => acc + d * weights[i], 0);
  const remainder = sum % 11;
  if (remainder === 0) {
    return 0;
  }
  if (remainder === 1) {
    return 10;
  }
  return 11 - remainder;
}

/** Build a 14-digit Egyptian ID with a valid checksum digit from a 13-digit payload. */
function buildValidEgId(payload: string): string {
  return `${payload}${checksumDigit(payload)}`;
}

describe("national ID validation", () => {
  describe("isValidNationalIdForCountry", () => {
    test("rejects empty/whitespace values", () => {
      expect(isValidNationalIdForCountry("", "EG")).toBe(false);
      expect(isValidNationalIdForCountry("   ", "EG")).toBe(false);
    });

    test("rejects values exceeding max length", () => {
      expect(isValidNationalIdForCountry("1".repeat(NATIONAL_ID_MAX_LENGTH + 1), "EG")).toBe(false);
    });

    test("accepts any non-empty value for unknown countries (lenient fallback)", () => {
      expect(isValidNationalIdForCountry("ABC123", "ZZ")).toBe(true);
      expect(isValidNationalIdForCountry("any-id", undefined)).toBe(true);
      expect(isValidNationalIdForCountry("any-id", null)).toBe(true);
    });

    test("is case-insensitive on the country code", () => {
      const validEg = buildValidEgId("2960123456781");
      expect(isValidNationalIdForCountry(validEg, "eg")).toBe(isValidNationalIdForCountry(validEg, "EG"));
    });
  });

  describe("isValidEgyptianNationalId", () => {
    // 2960123 → century 2 (1900s), year 96 (1996), month 01 (Jan), day 23.
    const validEgId = buildValidEgId("2960123456781");

    test("accepts real-world Egyptian national IDs", () => {
      // Production-verified IDs.
      for (const realId of ["30001011521216", "25007070200537", "27101221500329"]) {
        expect(isValidEgyptianNationalId(realId)).toBe(true);
        expect(isValidNationalIdForCountry(realId, "EG")).toBe(true);
      }
    });

    test("accepts a valid Egyptian national ID", () => {
      expect(isValidEgyptianNationalId(validEgId)).toBe(true);
      expect(isValidNationalIdForCountry(validEgId, "EG")).toBe(true);
    });

    test("rejects non-14-digit values", () => {
      expect(isValidEgyptianNationalId("2960123456781")).toBe(false); // 13 digits
      expect(isValidEgyptianNationalId("296012345678123")).toBe(false); // 15 digits
      expect(isValidEgyptianNationalId("2960123456781A")).toBe(false); // non-numeric
    });

    test("rejects invalid century digit", () => {
      // Flip century digit to 1 (invalid) while keeping the rest identical.
      const badCentury = `1${validEgId.slice(1)}`;
      expect(isValidEgyptianNationalId(badCentury)).toBe(false);
    });

    test("rejects invalid month", () => {
      // Month 13 is invalid. Patch digits 4–5 (indices 3,4) to "13".
      const badMonth = `${validEgId.slice(0, 3)}13${validEgId.slice(5)}`;
      expect(isValidEgyptianNationalId(badMonth)).toBe(false);
    });

    test("rejects invalid day (31 in February)", () => {
      // 2000-02-31 does not exist. Century 3, year 00, month 02, day 31.
      const withCheck = buildValidEgId("3000231000123");
      expect(isValidEgyptianNationalId(withCheck)).toBe(false);
    });

    test("rejects a wrong check digit", () => {
      // Corrupt the final digit so the checksum fails.
      const lastDigit = Number.parseInt(validEgId.slice(-1), 10);
      const corrupted = `${validEgId.slice(0, -1)}${(lastDigit + 1) % 10}`;
      expect(isValidEgyptianNationalId(corrupted)).toBe(false);
    });

    test("accepts a 2000s-century ID (century digit 3)", () => {
      // 3000123 → century 3 (2000s), year 00 (2000), month 01, day 23.
      const withCheck = buildValidEgId("3000123456781");
      expect(isValidEgyptianNationalId(withCheck)).toBe(true);
      expect(isValidNationalIdForCountry(withCheck, "EG")).toBe(true);
    });
  });
});

describe("national ID value object", () => {
  const validEgId = buildValidEgId("2960123456781");

  describe("isValidNationalId", () => {
    test("validates against the object's own country code", () => {
      expect(isValidNationalId({ countryCode: "EG", number: validEgId })).toBe(true);
      expect(isValidNationalId({ countryCode: "EG", number: "12345678901234" })).toBe(false);
    });

    test("rejects null or empty values", () => {
      expect(isValidNationalId(null)).toBe(false);
      expect(isValidNationalId(undefined)).toBe(false);
      expect(isValidNationalId({ countryCode: "EG", number: "" })).toBe(false);
    });

    test("falls back to lenient validation when the object carries no country", () => {
      expect(isValidNationalId({ countryCode: null, number: "any-value" })).toBe(true);
    });
  });

  describe("serializeNationalId / parseNationalId", () => {
    test("round-trips a national ID object", () => {
      const value = { countryCode: "EG", number: validEgId };
      const stored = serializeNationalId(value);
      expect(stored).toBe(`EG:${validEgId}`);
      expect(parseNationalId(stored)).toEqual(value);
    });

    test("serializes an object without a country code as a plain number", () => {
      expect(serializeNationalId({ countryCode: null, number: validEgId })).toBe(validEgId);
      expect(parseNationalId(validEgId)).toEqual({ countryCode: null, number: validEgId });
    });

    test("returns null for empty or whitespace values", () => {
      expect(serializeNationalId(null)).toBeNull();
      expect(serializeNationalId(undefined)).toBeNull();
      expect(serializeNationalId({ countryCode: "EG", number: "  " })).toBeNull();
      expect(parseNationalId(null)).toBeNull();
      expect(parseNationalId("")).toBeNull();
    });

    test("parses a country code containing extra content before the separator", () => {
      expect(parseNationalId("SA:1234567890")).toEqual({ countryCode: "SA", number: "1234567890" });
    });
  });
});
