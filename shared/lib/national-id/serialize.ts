// National ID value object + (de)serialization helpers.
//
// The national ID is modeled as an object `{ countryCode, number }` so the
// country of issuance travels with the number (the input's country selector
// drives per-country validation). The database stores a single encrypted
// string column, so the object is serialized as `countryCode:number` on write
// and parsed back on read. Legacy rows (plain numbers without a separator)
// parse back with a `null` countryCode.

import { isValidNationalIdForCountry } from "@/shared/lib/national-id/validate";

export type NationalIdValue = {
  readonly countryCode?: string | null;
  readonly number: string;
};

const SEPARATOR = ":";

/** Serialize a national ID object to the single encrypted string stored in the DB. */
export function serializeNationalId(value: NationalIdValue | null | undefined): string | null {
  const number = value?.number?.trim();
  if (!number) {
    return null;
  }
  const countryCode = value?.countryCode?.trim();
  return countryCode ? `${countryCode}${SEPARATOR}${number}` : number;
}

/**
 * Parse a stored national ID string back into its object form.
 *
 * Returns `null` for empty/whitespace values. Legacy rows stored as a plain
 * number (no `countryCode:` separator) parse back with a `null` countryCode.
 */
export function parseNationalId(stored: string | null | undefined): NationalIdValue | null {
  const trimmed = stored?.trim();
  if (!trimmed) {
    return null;
  }
  const separatorIndex = trimmed.indexOf(SEPARATOR);
  if (separatorIndex === -1) {
    return { countryCode: null, number: trimmed };
  }
  return {
    countryCode: trimmed.slice(0, separatorIndex),
    number: trimmed.slice(separatorIndex + 1),
  };
}

/**
 * Validate a national ID object against the format rules of its own country.
 * When the object carries no country code, falls back to the lenient
 * "non-empty, within max length" check of `isValidNationalIdForCountry`.
 */
export function isValidNationalId(value: NationalIdValue | null | undefined): boolean {
  if (!value) {
    return false;
  }
  return isValidNationalIdForCountry(value.number, value.countryCode);
}
