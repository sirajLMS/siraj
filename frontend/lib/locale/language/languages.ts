import { AppLanguage } from "@/frontend/graphql/generated/gql/graphql-types";
import type { LanguageType } from "./types";

export const languages: readonly LanguageType[] = [
  { code: AppLanguage.Ar, emoji: "🇸🇦" },
  { code: AppLanguage.En, emoji: "🇬🇧" },
];

export default languages;
