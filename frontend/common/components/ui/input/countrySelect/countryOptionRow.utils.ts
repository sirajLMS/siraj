import { type CountryType, getCountryDisplayName } from "@/frontend/common/lib/locale";

// NEW FOR PLAN v5: consolidated byte-identical tier twin (mobile/desktop) countryOptionRow.utils.ts into a single common source.
export function getCountryOptionLabel(country: CountryType, locale: string, showPhonePrefix = true): string {
  const name = getCountryDisplayName(country.code, locale);
  if (!showPhonePrefix) {
    return name;
  }
  return `${name} (+${country.phone})`;
}
