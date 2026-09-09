import { countries } from "@/frontend/common/lib/locale/country/countries";
import type { CountryType } from "@/frontend/common/lib/locale/country/types";
import { resolveUiCountryCode } from "@/shared/lib/locale/excluded-ui-countries";

/** Pre-built Map for O(1) country lookups by code string. */
export const countryByCodeMap: ReadonlyMap<string, CountryType> = new Map(
  countries.map(country => [country.code.toString(), country])
);

/** Find a country entry by ISO 3166-1 alpha-2 code in O(1) time. */
export function getCountryByCode(countryCode: string): CountryType | undefined {
  const normalizedCode = resolveUiCountryCode(countryCode);
  if (!normalizedCode) {
    return undefined;
  }
  return countryByCodeMap.get(normalizedCode);
}
