import type { AppLanguage } from "@/frontend/graphql/generated/gql/graphql-types";
import languages from "./languages";
import type { LanguageType } from "./types";

/** Find a language entry by app language code. */
export function getLanguageByCode(languageCode: AppLanguage | string): LanguageType | undefined {
  return languages.find(language => language.code === languageCode);
}
