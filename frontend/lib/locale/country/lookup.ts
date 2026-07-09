import { resolveUiCountryCode } from "@/shared/lib/locale/excluded-ui-countries";
import countries from "./countries";
import type { CountryType } from "./types";

/** Find a country entry by ISO 3166-1 alpha-2 code. */
export function getCountryByCode(countryCode: string): CountryType | undefined {
  const normalizedCode = resolveUiCountryCode(countryCode);
  if (!normalizedCode) {
    return undefined;
  }
  return countries.find(country => country.code === normalizedCode);
}
