import type { AppLanguage } from "@/frontend/graphql/generated/gql/graphql-types";

export interface LanguageType {
  code: AppLanguage;
  emoji: string;
}
