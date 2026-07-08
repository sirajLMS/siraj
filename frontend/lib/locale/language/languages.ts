import { AppLanguage } from "@/shared/lib/enum";
import type { LanguageType } from "./types";

export const languages: readonly LanguageType[] = [
  { code: AppLanguage.ar, emoji: "🇸🇦" },
  { code: AppLanguage.en, emoji: "🇬🇧" },
];

export default languages;
