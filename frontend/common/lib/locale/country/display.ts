/** Cache of region `Intl.DisplayNames` instances keyed by locale tag. */
const regionDisplayNamesCache = new Map<string, Intl.DisplayNames>();

function getRegionDisplayNames(locale: string): Intl.DisplayNames {
  let displayNames = regionDisplayNamesCache.get(locale);
  if (!displayNames) {
    displayNames = new Intl.DisplayNames([locale], { type: "region" });
    regionDisplayNamesCache.set(locale, displayNames);
  }
  return displayNames;
}

/** Resolve a localized country display name via Intl.DisplayNames. */
export function getCountryDisplayName(countryCode: string, locale: string): string {
  try {
    return getRegionDisplayNames(locale).of(countryCode) ?? countryCode;
  } catch {
    return countryCode;
  }
}
