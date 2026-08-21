import type {
  QuotaFieldsFragment,
  QuotaLedgerQuery_quotaLedger_rows,
} from "@/frontend/common/graphql/generated/gql/graphql";

export type QuotaItem = QuotaFieldsFragment;

export type QuotaLedgerItem = QuotaLedgerQuery_quotaLedger_rows;

export type {
  QuotaKind,
  QuotaLedgerReason,
  QuotaPeriodType,
  QuotaStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";
