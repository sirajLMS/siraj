/** Resolve a localized country display name via Intl.DisplayNames. */
export function getCountryDisplayName(countryCode: string, locale: string): string {
  const displayNames = new Intl.DisplayNames([locale], { type: "region" });
  return displayNames.of(countryCode) ?? countryCode;
}
