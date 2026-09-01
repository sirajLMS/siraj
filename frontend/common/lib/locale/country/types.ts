import type { CountryCode } from "@/frontend/common/graphql/generated/gql/graphql";

export interface CountryType {
  code: CountryCode;
  phone: string;
  emoji: string;
  suggested?: boolean;
}
