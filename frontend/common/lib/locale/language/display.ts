import type { AppLanguage } from "@/frontend/common/graphql/generated/gql/graphql";

/** Cache of language `Intl.DisplayNames` instances keyed by locale tag. */
const languageDisplayNamesCache = new Map<string, Intl.DisplayNames>();

function getLanguageDisplayNames(locale: string): Intl.DisplayNames {
  let displayNames = languageDisplayNamesCache.get(locale);
  if (!displayNames) {
    displayNames = new Intl.DisplayNames([locale], { type: "language" });
    languageDisplayNamesCache.set(locale, displayNames);
  }
  return displayNames;
}

/** Resolve a localized language display name via Intl.DisplayNames. */
export function getLanguageDisplayName(languageCode: AppLanguage | string, locale: string): string {
  try {
    return getLanguageDisplayNames(locale).of(languageCode) ?? languageCode;
  } catch {
    return languageCode;
  }
}
