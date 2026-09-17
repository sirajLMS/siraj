import type { AppLanguage } from "@/frontend/common/graphql/generated/gql/graphql";

const displayNamesCache = new Map<string, Intl.DisplayNames>();

function getLanguageDisplayNames(locale: string): Intl.DisplayNames {
  let displayNames = displayNamesCache.get(locale);
  if (!displayNames) {
    displayNames = new Intl.DisplayNames([locale], { type: "language" });
    displayNamesCache.set(locale, displayNames);
  }
  return displayNames;
}

/**
 * Resolve a localized language display name via Intl.DisplayNames.
 * Uses a cached Intl.DisplayNames instance per locale to eliminate repeated initialization overhead.
 */
export function getLanguageDisplayName(languageCode: AppLanguage | string, locale: string): string {
  try {
    return getLanguageDisplayNames(locale).of(languageCode) ?? languageCode;
  } catch {
    return languageCode;
  }
}
