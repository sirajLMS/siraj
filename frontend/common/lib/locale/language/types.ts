import type { AppLanguage } from "@/frontend/common/graphql/generated/gql/graphql-types";

export interface LanguageType {
  code: AppLanguage;
  emoji: string;
}
