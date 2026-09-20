/** Module-level cache for Intl.DisplayNames region instances. */
const regionDisplayNamesCache = new Map<string, Intl.DisplayNames>();

function getRegionDisplayNamesFormatter(locale: string): Intl.DisplayNames {
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
    return getRegionDisplayNamesFormatter(locale).of(countryCode) ?? countryCode;
  } catch {
    return countryCode;
  }
}
