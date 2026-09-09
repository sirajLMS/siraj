import { countryByCodeMap } from "@/frontend/common/lib/locale/country/lookup";
import { isExcludedUiCountryCode, resolveUiCountryCode } from "@/shared/lib/locale/excluded-ui-countries";

const REGIONAL_INDICATOR_BASE = 0x1f1e6;
const ASCII_LETTER_A = 65;

/** Derive a flag emoji from an ISO 3166-1 alpha-2 country code. */
export function countryCodeToEmoji(countryCode: string): string {
  return Array.from(countryCode.toUpperCase())
    .map(char => String.fromCodePoint(REGIONAL_INDICATOR_BASE - ASCII_LETTER_A + (char.codePointAt(0) ?? 0)))
    .join("");
}

/** Look up the flag emoji for a known country, falling back to code derivation. */
export function getCountryEmoji(countryCode: string): string {
  const normalizedCode = resolveUiCountryCode(countryCode);
  if (!normalizedCode) {
    return "🌐";
  }
  const match = countryByCodeMap.get(normalizedCode);
  return match?.emoji ?? (isExcludedUiCountryCode(countryCode) ? "🌐" : countryCodeToEmoji(normalizedCode));
}
