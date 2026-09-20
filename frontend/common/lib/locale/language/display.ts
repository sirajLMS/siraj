import type { AppLanguage } from "@/frontend/common/graphql/generated/gql/graphql";

/** Module-level cache for Intl.DisplayNames language instances. */
const languageDisplayNamesCache = new Map<string, Intl.DisplayNames>();

function getLanguageDisplayNamesFormatter(locale: string): Intl.DisplayNames {
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
    return getLanguageDisplayNamesFormatter(locale).of(languageCode) ?? languageCode;
  } catch {
    return languageCode;
  }
}
