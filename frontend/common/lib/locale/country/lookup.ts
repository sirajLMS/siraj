import countries from "@/frontend/common/lib/locale/country/countries";
import type { CountryType } from "@/frontend/common/lib/locale/country/types";
import { resolveUiCountryCode } from "@/shared/lib/locale/excluded-ui-countries";

/** Find a country entry by ISO 3166-1 alpha-2 code. */
export function getCountryByCode(countryCode: string): CountryType | undefined {
  const normalizedCode = resolveUiCountryCode(countryCode);
  if (!normalizedCode) {
    return undefined;
  }
  return countries.find(country => country.code === normalizedCode);
}
