import type { AppLanguage } from "@/frontend/common/graphql/generated/gql/graphql-types";

/** Resolve a localized language display name via Intl.DisplayNames. */
export function getLanguageDisplayName(languageCode: AppLanguage | string, locale: string): string {
  const displayNames = new Intl.DisplayNames([locale], { type: "language" });
  return displayNames.of(languageCode) ?? languageCode;
}
