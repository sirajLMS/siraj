import type { AppLanguage } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { languages } from "@/frontend/common/lib/locale/language/languages";
import type { LanguageType } from "@/frontend/common/lib/locale/language/types";

/** Find a language entry by app language code. */
export function getLanguageByCode(languageCode: AppLanguage | string): LanguageType | undefined {
  return languages.find(language => String(language.code) === String(languageCode));
}
