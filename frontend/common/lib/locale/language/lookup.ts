import { languages } from "@/frontend/common/lib/locale/language/languages";
import type { LanguageType } from "@/frontend/common/lib/locale/language/types";

/** Pre-built Map for O(1) language lookups by code. */
const languageByCodeMap: ReadonlyMap<string, LanguageType> = new Map(
  languages.map(language => [language.code as string, language])
);

/** Find a language entry by app language code in O(1) time. */
export function getLanguageByCode(languageCode: string): LanguageType | undefined {
  return languageByCodeMap.get(languageCode);
}
