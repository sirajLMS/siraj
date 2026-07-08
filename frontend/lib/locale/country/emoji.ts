import type { CountryCode } from "@/frontend/graphql/generated/gql/graphql";
import countries from "./countries";

const REGIONAL_INDICATOR_BASE = 0x1f1e6;
const ASCII_LETTER_A = 65;

/** Derive a flag emoji from an ISO 3166-1 alpha-2 country code. */
export function countryCodeToEmoji(countryCode: string): string {
  return [...countryCode.toUpperCase()]
    .map(char => String.fromCodePoint(REGIONAL_INDICATOR_BASE - ASCII_LETTER_A + char.charCodeAt(0)))
    .join("");
}

/** Look up the flag emoji for a known country, falling back to code derivation. */
export function getCountryEmoji(countryCode: CountryCode | string): string {
  const normalizedCode = countryCode.toUpperCase();
  const match = countries.find(country => country.code === normalizedCode);
  return match?.emoji ?? countryCodeToEmoji(normalizedCode);
}
