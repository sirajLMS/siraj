const countryDisplayNamesCache = new Map<string, Intl.DisplayNames>();

function getCountryDisplayNames(locale: string): Intl.DisplayNames {
  let displayNames = countryDisplayNamesCache.get(locale);
  if (!displayNames) {
    displayNames = new Intl.DisplayNames([locale], { type: "region" });
    countryDisplayNamesCache.set(locale, displayNames);
  }
  return displayNames;
}

/** Resolve a localized country display name via Intl.DisplayNames. */
export function getCountryDisplayName(countryCode: string, locale: string): string {
  try {
    return getCountryDisplayNames(locale).of(countryCode) ?? countryCode;
  } catch {
    return countryCode;
  }
}
