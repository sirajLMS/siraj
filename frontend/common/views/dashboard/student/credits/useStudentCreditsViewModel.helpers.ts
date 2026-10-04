import type { CreditReason, StudentCreditTransactionsQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import type { StudentCreditTransactionRow } from "@/frontend/common/views/dashboard/student/credits/types/studentCreditsTypes";

export type CreditReasonFilter = "ALL" | CreditReason;

export interface CreditReasonFilterOption {
  readonly value: CreditReasonFilter;
  readonly label: string;
}

export type TransactionItem = NonNullable<
  NonNullable<StudentCreditTransactionsQuery["studentCreditTransactions"]>[number]
>;

export function mapTransaction(raw: TransactionItem): StudentCreditTransactionRow {
  // Hour-based transactions carry changeAmountHours ("15.00") with a null
  // changeAmount; legacy class-credit purchases carry the inverse shape.
  // Prefer hours so hour grants never collapse to a displayed 0.
  const hours = raw.changeAmountHours;
  const changeAmount = hours != null ? Number(hours) : (raw.changeAmount ?? 0);
  return {
    id: raw.id ?? "",
    changeAmount: Number.isFinite(changeAmount) ? changeAmount : 0,
    isHours: hours != null,
    reason: raw.reason ?? null,
    notes: raw.notes ?? null,
    createdAt: raw.createdAt ?? null,
  };
}

export const DEFAULT_PAGE_SIZE = 10;
