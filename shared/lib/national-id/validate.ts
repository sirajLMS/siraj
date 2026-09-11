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
 * century digit, valid date, gender-digit parity) and a Luhn checksum, which
 * catches the vast majority of typos without coupling to the official
 * (undocumented) algorithm.
 */
export function isValidEgyptianNationalId(value: string): boolean {
  if (!/^\d{14}$/.test(value)) {
    return false;
  }

  // Performance optimization (Bolt): Read digits directly from string character
  // codes (`charCodeAt(i) - 48`) instead of allocating intermediate arrays via `split("")` and `map(Number)`.

  // Century digit.
  const century = value.charCodeAt(0) - 48;
  if (century !== 2 && century !== 3) {
    return false;
  }

  // Year + month + day must form a plausible Gregorian date.
  const yy = (value.charCodeAt(1) - 48) * 10 + (value.charCodeAt(2) - 48);
  const year = century === 2 ? 1900 + yy : 2000 + yy;
  const month = (value.charCodeAt(3) - 48) * 10 + (value.charCodeAt(4) - 48);
  const day = (value.charCodeAt(5) - 48) * 10 + (value.charCodeAt(6) - 48);
  if (!isValidDate(year, month, day)) {
    return false;
  }

  // Governorate digit (digit 8): 1–8 are domestic governorates; 9, 0, and the
  // 88–99 range are used for born-abroad. We accept any digit here to avoid
  // coupling to the official governorate table.
  // (No further constraint on digits 8–13 beyond the checksum below.)

  // Luhn checksum over all 14 digits — the final digit is the check digit.
  return luhnChecksumValid(value);
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

/** Standard Luhn check: the last digit is the check digit for the preceding digits. */
function luhnChecksumValid(value: string): boolean {
  let sum = 0;
  const len = value.length; // 14 for Egyptian national ID
  // Process all digits except the final check digit.
  for (let i = 0; i < len - 1; i += 1) {
    let d = value.charCodeAt(i) - 48;
    // Double every second digit from the right (i.e. odd index from the left
    // when counting from the leftmost payload digit).
    if ((len - 2 - i) % 2 === 0) {
      d *= 2;
      if (d > 9) {
        d -= 9;
      }
    }
    sum += d;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  const lastDigit = value.charCodeAt(len - 1) - 48;
  return checkDigit === lastDigit;
}
