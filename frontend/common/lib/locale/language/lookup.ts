import { languages } from "@/frontend/common/lib/locale/language/languages";
import type { LanguageType } from "@/frontend/common/lib/locale/language/types";

/** Find a language entry by app language code. */
export function getLanguageByCode(languageCode: string): LanguageType | undefined {
  return languages.find(language => (language.code as string) === languageCode);
}
