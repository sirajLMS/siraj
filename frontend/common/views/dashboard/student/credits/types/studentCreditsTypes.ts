import type { CreditReason } from "@/frontend/common/graphql/generated/gql/graphql";

export interface StudentCreditTransactionRow {
  readonly id: string;
  /** Display delta: hours when hours-based (changeAmountHours), else legacy class-credit units. */
  readonly changeAmount: number;
  /** True when the delta is expressed in credit hours (hours-based transaction). */
  readonly isHours: boolean;
  readonly reason: CreditReason | null;
  readonly notes: string | null;
  readonly createdAt: string | null;
}

export interface StudentCreditBalanceInfo {
  /** Remaining credit hours in the student's hour pool. */
  readonly hoursRemaining: number;
  /** Total credit hours ever granted. */
  readonly hoursTotal: number;
}
