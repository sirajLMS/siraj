import { type CountryType, getCountryDisplayName } from "@/frontend/common/lib/locale";

/**
 * Desktop-tier utility for country autocomplete option label formatting.
 * Duplicate of this desktop file.
 */
export function getCountryOptionLabel(country: CountryType, locale: string, showPhonePrefix = true): string {
  const name = getCountryDisplayName(country.code, locale);
  if (!showPhonePrefix) {
    return name;
  }
  return `${name} (+${country.phone})`;
}
