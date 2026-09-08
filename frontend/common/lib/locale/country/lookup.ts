import { countries } from "@/frontend/common/lib/locale/country/countries";
import type { CountryType } from "@/frontend/common/lib/locale/country/types";
import { resolveUiCountryCode } from "@/shared/lib/locale/excluded-ui-countries";

/** Map ISO 3166-1 alpha-2 code to country entry for O(1) constant-time lookup. */
const countryByCodeMap = new Map<string, CountryType>(
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
