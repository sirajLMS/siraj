import type { AppLanguage } from "@/shared/lib/enum";

/** Resolve a localized language display name via Intl.DisplayNames. */
export function getLanguageDisplayName(languageCode: AppLanguage | string, locale: string): string {
  const displayNames = new Intl.DisplayNames([locale], { type: "language" });
  return displayNames.of(languageCode) ?? languageCode;
}
