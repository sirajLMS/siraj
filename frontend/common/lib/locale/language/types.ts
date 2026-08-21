import type { AppLanguage } from "@/frontend/common/graphql/generated/gql/graphql";

export interface LanguageType {
  code: AppLanguage;
  emoji: string;
}
