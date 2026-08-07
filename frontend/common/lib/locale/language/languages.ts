import { AppLanguage } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { LanguageType } from "@/frontend/common/lib/locale/language/types";

export const languages: readonly LanguageType[] = [
  { code: AppLanguage.Ar, emoji: "🇸🇦" },
  { code: AppLanguage.En, emoji: "🇬🇧" },
];
