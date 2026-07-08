import type { AppLanguage } from "@/frontend/graphql/generated/gql/graphql-types";
import languages from "./languages";

const FALLBACK_LANGUAGE_EMOJI = "🌐";

/** Look up the representative flag emoji for a known app language. */
export function getLanguageEmoji(languageCode: AppLanguage | string): string {
  const match = languages.find(language => language.code === languageCode);
  return match?.emoji ?? FALLBACK_LANGUAGE_EMOJI;
}
