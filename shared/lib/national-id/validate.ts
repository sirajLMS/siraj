// Country-aware national ID validation.
//
// Lives in `shared/` so both the frontend Zod schema (`.refine`/`.superRefine`)
// and the backend service layer can call the same canonical validator —
// mirroring the `shared/lib/phone/parse.ts` pattern (value + region string → boolean).
//
// The `countryCode` parameter is an ISO 3166-1 alpha-2 code passed as a plain
// string (e.g. "EG"). We deliberately do NOT import the `CountryCode` enum here
// because `shared/` cannot depend on `@/backend/**` (see shared/AGENTS.md).
// Callers in backend/frontend pass the enum's `.valueOf()` string.

/** Maximum accepted length for any national ID (matches the GraphQL `maxLength: 255` constraint). */
export const NATIONAL_ID_MAX_LENGTH = 255;

/**
 * Validate a national ID against the format rules of the given country.
 *
 * Returns `true` when the value is a syntactically valid national ID for the
 * country, `false` otherwise. Unknown countries fall back to a lenient
 * "non-empty, within max length" check so first-login is never blocked on a
 * missing per-country rule (add rules as new countries are supported).
 *
 * @param value   The raw national ID string entered by the user.
 * @param countryCode ISO 3166-1 alpha-2 country code (e.g. "EG" for Egypt).
 */
export function isValidNationalIdForCountry(value: string, countryCode: string | null | undefined): boolean {
  const trimmed = value?.trim();
  if (!trimmed) {
    return false;
  }
  if (trimmed.length > NATIONAL_ID_MAX_LENGTH) {
    return false;
  }

  const region = (countryCode ?? "").toUpperCase();
  // No country-specific rule yet — accept any non-empty value within the
  // max length. Per-country rules can be added as new branches.
  if (region !== "EG") {
    return true;
  }
  return isValidEgyptianNationalId(trimmed);
}

/**
 * Egyptian national ID (الرقم القومي) validation.
 *
 * Format: 14 digits.
 *  - Digit 1: century of birth — `2` for 1900–1999, `3` for 2000–2099.
 *  - Digits 2–3: 2-digit year within the century (YY).
 *  - Digits 4–5: month (01–12).
 *  - Digits 6–7: day (01–31).
 *  - Digit 8: governorate code (1–8 for governorates, 9/0/88/... for born-abroad ranges).
 *  - Digits 9–13: sequence number; digit 13 parity: odd = male, even = female.
 *  - Digit 14: checksum (Luhn-style check digit used by the Egyptian authority).
 *
 * We enforce the structural/semantic checks that are deterministic (length,
 * century digit, valid date) and the weighted mod-11 checksum, which catches
 * the vast majority of typos.
 */
export function isValidEgyptianNationalId(value: string): boolean {
  if (!/^\d{14}$/.test(value)) {
    return false;
  }

  const digit = (i: number) => value.charCodeAt(i) - 48;

  // Century digit.
  const century = digit(0);
  if (century !== 2 && century !== 3) {
    return false;
  }

  // Year + month + day must form a plausible Gregorian date.
  const yy = digit(1) * 10 + digit(2);
  const year = century === 2 ? 1900 + yy : 2000 + yy;
  const month = digit(3) * 10 + digit(4);
  const day = digit(5) * 10 + digit(6);
  if (!isValidDate(year, month, day)) {
    return false;
  }

  // Governorate digit (digit 8): 1–8 are domestic governorates; 9, 0, and the
  // 88–99 range are used for born-abroad. We accept any digit here to avoid
  // coupling to the official governorate table.
  // (No further constraint on digits 8–13 beyond the checksum below.)

  // Weighted mod-11 checksum over all 14 digits — the final digit is the
  // check digit (weights [2,7,6,5,4,3,2,7,6,5,4,3,2] over digits 1-13).
  return checksumValid(value);
}

function isValidDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12) {
    return false;
  }
  if (day < 1 || day > 31) {
    return false;
  }
  // Days-in-month check (handles leap years for February).
  const daysInMonth = new Date(year, month, 0).getDate();
  return day <= daysInMonth;
}

/**
 * Weighted mod-11 check digit for the Egyptian national ID.
 *
 * The 14th digit is a checksum: digits 1-13 are multiplied by the weights
 * [2,7,6,5,4,3,2,7,6,5,4,3,2] and summed; the remainder mod 11 determines the
 * check digit — `11 - remainder`, with a remainder of 0 mapping to 0 and a
 * remainder of 1 mapping to check digit `10`, which cannot appear in a valid
 * ID (a single digit), so such IDs are invalid.
 */
function checksumValid(value: string): boolean {
  const weights = [2, 7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < weights.length; i += 1) {
    sum += (value.charCodeAt(i) - 48) * weights[i];
  }
  const remainder = sum % 11;
  let expected: number;
  if (remainder === 0) {
    expected = 0;
  } else if (remainder === 1) {
    // Check digit 10 cannot appear as a single digit — such IDs are invalid.
    expected = 10;
  } else {
    expected = 11 - remainder;
  }
  return expected === value.charCodeAt(13) - 48;
}
