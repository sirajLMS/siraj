import { describe, expect, test } from "bun:test";
import {
  isValidEgyptianNationalId,
  isValidNationalIdForCountry,
  NATIONAL_ID_MAX_LENGTH,
} from "@/shared/lib/national-id";

/** Compute the Luhn check digit for a 13-digit payload (Egyptian ID). */
function luhnCheckDigit(payload: string): number {
  const digits = payload
    .split("")
    .map(Number)
    .filter(n => !Number.isNaN(n));
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    let d = digits[i];
    // For a 13-digit payload, double digits at even indices from the left
    // (which become "every second digit from the right" once the check digit
    // is appended).
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) {
        d -= 9;
      }
    }
    sum += d;
  }
  return (10 - (sum % 10)) % 10;
}

/** Build a 14-digit Egyptian ID with a valid Luhn check digit from a 13-digit payload. */
function buildValidEgId(payload: string): string {
  return `${payload}${luhnCheckDigit(payload)}`;
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
      // Corrupt the final digit so the Luhn checksum fails.
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
