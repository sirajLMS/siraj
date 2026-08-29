import type { creditTransactions } from "@/backend/db/schema";
import type { CreditAdjustmentType, CreditReason } from "@/backend/enum";

export type CreditTransactionSelectType = typeof creditTransactions.$inferSelect;
export type CreditTransactionInsertType = typeof creditTransactions.$inferInsert;

export type CreditTransactionReturnType = Omit<CreditTransactionSelectType, "reason"> & {
  reason: CreditReason;
};

export interface CreditTransactionSubmitInput {
  studentId: string;
  hours: number;
  notes?: string | null;
  sourcePaymentId?: string | null;
}

export interface CreditBalanceReturnType {
  studentId: string;
  classesTotal: number;
  classesRemaining: number;
}

/** Input for the hour-based parallel ledger (changeAmountHours rows). */
export interface CreditHourTransactionSubmitInput {
  studentId: string;
  hours: number;
  notes?: string | null;
  sourcePaymentId?: string | null;
}

/** Hour balance mirrors CreditBalanceReturnType with decimal strings. */
export interface CreditHourBalanceReturnType {
  studentId: string;
  creditHoursTotal: string;
  creditHoursRemaining: string;
}

/** Operator-facing input for a manual credit adjustment (add / subtract / subtract-with-carryover). */
export interface CreditAdjustmentInput {
  studentId: string;
  adjustmentType: CreditAdjustmentType;
  /** Positive class-credit amount; the sign is derived from adjustmentType. */
  hours: number;
  /** Sanitized rich-text reason for the adjustment. */
  notes?: string | null;
  /** Carryover metadata — required when adjustmentType is SUBTRACT_WITH_CARRYOVER. */
  carryoverTeacherId?: string | null;
  /** ISO date strings (YYYY-MM-DD) — carryover columns are TEXT in the schema. */
  carryoverFromDate?: string | null;
  carryoverToDate?: string | null;
  carryoverPaymentDate?: string | null;
}

/** Adjustment ledger row returned to callers, carrying the carryover metadata columns. */
export interface CreditAdjustmentReturnType extends CreditTransactionReturnType {
  adjustmentType: CreditAdjustmentType;
  carryoverTeacherId: string | null;
  carryoverFromDate: string | null;
  carryoverToDate: string | null;
  carryoverPaymentDate: string | null;
}

/** Repository insert payload for a single adjustment ledger row. */
export interface CreditAdjustmentInsertInput {
  studentId: string;
  /** Signed class-credit delta (positive for ADD, negative for subtract variants). */
  changeAmount: number;
  reason: CreditReason;
  adjustmentType: CreditAdjustmentType;
  /** Sanitized rich-text reason for the adjustment. */
  notes?: string | null;
  creditedByUserId: string;
  carryoverTeacherId?: string | null;
  carryoverFromDate?: string | null;
  carryoverToDate?: string | null;
  carryoverPaymentDate?: string | null;
  idempotencyKey: string;
}
