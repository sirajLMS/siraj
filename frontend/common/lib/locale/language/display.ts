import type { AppLanguage } from "@/frontend/common/graphql/generated/gql/graphql";

/** Cache of Intl.DisplayNames instances per locale to avoid heavy object allocations in hot render paths. */
const languageDisplayNamesCache = new Map<string, Intl.DisplayNames>();

function getLanguageDisplayNamesFormatter(locale: string): Intl.DisplayNames {
  let formatter = languageDisplayNamesCache.get(locale);
  if (!formatter) {
    formatter = new Intl.DisplayNames([locale], { type: "language" });
    languageDisplayNamesCache.set(locale, formatter);
  }
  return formatter;
}

/** Resolve a localized language display name via Intl.DisplayNames. */
export function getLanguageDisplayName(languageCode: AppLanguage | string, locale: string): string {
  try {
    return getLanguageDisplayNamesFormatter(locale).of(languageCode) ?? languageCode;
  } catch {
    return languageCode;
  }
}
