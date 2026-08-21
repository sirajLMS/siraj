import { QuotaKind, QuotaPeriodType } from "@/frontend/common/graphql/generated/gql/graphql";

export function isQuotaKind(value: string): value is QuotaKind {
  return (Object.values(QuotaKind) as readonly string[]).includes(value);
}

export function isQuotaPeriodType(value: string): value is QuotaPeriodType {
  return (Object.values(QuotaPeriodType) as readonly string[]).includes(value);
}
