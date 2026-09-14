import type { creditTransactions } from "@/backend/db/schema";
import type { CreditAdjustmentType, CreditReason } from "@/backend/enum";
import type { DBTransaction } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export type CreditTransactionSelectType = typeof creditTransactions.$inferSelect;
export type CreditTransactionInsertType = typeof creditTransactions.$inferInsert;

export type CreditTransactionReturnType = Omit<CreditTransactionSelectType, "reason"> & {
  reason: CreditReason;
};

/** Classes-ledger purchase input; hours are class-credit units (persisted as changeAmount). */
export interface CreditClassesSubmitInput {
  studentId: string;
  /** Positive class-credit amount purchased. */
  hours: number;
  notes?: string | null;
  sourcePaymentId?: string | null;
}

/** Hour-ledger purchase input; hours are instructional-hour units (persisted as changeAmountHours). */
export interface CreditHoursSubmitInput {
  studentId: string;
  /** Positive instructional-hour amount purchased; may be fractional. */
  hours: number;
  creditedByUserId: string;
  notes?: string | null;
  sourcePaymentId?: string | null;
}

export interface CreditBalanceReturnType {
  studentId: string;
  classesTotal: number;
  classesRemaining: number;
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
  /** Operator-supplied rich-text reason; sanitized by the service before persistence. */
  notes?: string | null;
  /** Plain-text operator note, accounting-only: stored verbatim (not rich-text sanitized), never rendered on student/parent surfaces. */
  internalNotes?: string | null;
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
  /** Plain-text operator note, accounting-only (see CreditAdjustmentInput.internalNotes). */
  internalNotes: string | null;
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
  /** Plain-text operator note, accounting-only; stored verbatim. */
  internalNotes?: string | null;
  creditedByUserId: string;
  carryoverTeacherId?: string | null;
  carryoverFromDate?: string | null;
  carryoverToDate?: string | null;
  carryoverPaymentDate?: string | null;
  idempotencyKey: string;
}

/** Outcome of an adjustment transaction: the committed/returned row and whether it was newly persisted. */
export interface AdjustmentTxResult {
  row: CreditAdjustmentReturnType;
  /** False when the idempotency pre-check replayed an earlier persisted row. */
  createdNewRow: boolean;
}

/** Fully-present carryover block of an adjustment input. */
export interface CarryoverBlock {
  teacherId: string;
  fromDate: string;
  toDate: string;
  paymentDate: string;
}

/** Shared parameters of a single adjustment transaction. */
export interface AdjustmentTxParams {
  actorUserId: string;
  input: CreditAdjustmentInput;
  tErrors: ErrorsLabels;
  idempotencyKey: string;
  /** Signed class-credit delta for the ledger row. */
  signedHours: number;
  reason: CreditReason;
  /** Present only for subtract-with-carryover adjustments. */
  carryover?: CarryoverBlock;
}

/** Parameters of one idempotent booking-ledger mutation (deduct or refund), keyed on the derived idempotency key. */
export interface IdempotentBookingLedgerOp {
  studentId: string;
  classInstanceId: string;
  creditedByUserId: string;
  idempotencyKey: string;
  tx: DBTransaction;
  operation: "deduct" | "refund";
  /** Ledger discriminator — hour keys must never collide with class keys. */
  unit?: "classes" | "hours";
  successLogMessage: string;
  errorLogMessage: string;
  applyLedgerChange: (effectiveIdempotencyKey: string) => Promise<unknown>;
  adjustStudentClasses: () => Promise<unknown>;
}
