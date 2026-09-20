/** Cache of Intl.DisplayNames instances per locale to avoid heavy object allocations in hot render paths. */
const countryDisplayNamesCache = new Map<string, Intl.DisplayNames>();

function getCountryDisplayNamesFormatter(locale: string): Intl.DisplayNames {
  let formatter = countryDisplayNamesCache.get(locale);
  if (!formatter) {
    formatter = new Intl.DisplayNames([locale], { type: "region" });
    countryDisplayNamesCache.set(locale, formatter);
  }
  return formatter;
}

/** Resolve a localized country display name via Intl.DisplayNames. */
export function getCountryDisplayName(countryCode: string, locale: string): string {
  try {
    return getCountryDisplayNamesFormatter(locale).of(countryCode) ?? countryCode;
  } catch {
    return countryCode;
  }
}
