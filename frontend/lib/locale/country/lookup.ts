import countries from "./countries";
import type { CountryType } from "./types";

/** Find a country entry by ISO 3166-1 alpha-2 code. */
export function getCountryByCode(countryCode: string): CountryType | undefined {
  const normalizedCode = countryCode.toUpperCase();
  return countries.find(country => country.code === normalizedCode);
}
