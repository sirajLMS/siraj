import type { CreditReason } from "@/frontend/common/graphql/generated/gql/graphql-types";

export interface StudentCreditTransactionRow {
  readonly id: string;
  readonly changeAmount: number;
  readonly reason: CreditReason | null;
  readonly notes: string | null;
  readonly createdAt: string | null;
}

export interface StudentCreditBalanceInfo {
  readonly classesRemaining: number;
  readonly classesTotal: number;
}
