const displayNamesCache = new Map<string, Intl.DisplayNames>();

function getRegionDisplayNames(locale: string): Intl.DisplayNames {
  let displayNames = displayNamesCache.get(locale);
  if (!displayNames) {
    displayNames = new Intl.DisplayNames([locale], { type: "region" });
    displayNamesCache.set(locale, displayNames);
  }
  return displayNames;
}

/**
 * Resolve a localized country display name via Intl.DisplayNames.
 * Uses a cached Intl.DisplayNames instance per locale to eliminate repeated initialization overhead.
 */
export function getCountryDisplayName(countryCode: string, locale: string): string {
  try {
    return getRegionDisplayNames(locale).of(countryCode) ?? countryCode;
  } catch {
    return countryCode;
  }
}
