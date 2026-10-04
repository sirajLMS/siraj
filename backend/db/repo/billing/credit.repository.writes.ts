import { createHash } from "node:crypto";
import { findByIdempotencyKeysImpl } from "@/backend/db/repo/billing/credit.repository.queries";
import { creditTransactions } from "@/backend/db/schema";
import { CreditReason } from "@/backend/enum";
import { DomainError } from "@/backend/lib/errors";
import type {
  CreditAdjustmentInsertInput,
  CreditTransactionInsertType,
  CreditTransactionSelectType,
  DBTransaction,
} from "@/backend/types";

const insertCreditTransaction = async (
  tx: DBTransaction,
  input: CreditTransactionInsertType
): Promise<CreditTransactionSelectType> => {
  // XOR invariant: a row must carry EITHER classes OR hours — never both, never
  // neither (mirrors the DB CHECK constraint as an early failure).
  const hasClasses = input.changeAmount !== undefined && input.changeAmount !== null;
  const hasHours = input.changeAmountHours !== undefined && input.changeAmountHours !== null;
  if (hasClasses === hasHours) {
    throw new DomainError(
      "CREDIT_XOR_VIOLATION",
      "credit_transaction must set exactly one of changeAmount / changeAmountHours"
    );
  }
  const now = new Date();
  const [row] = await tx
    .insert(creditTransactions)
    .values({
      studentId: input.studentId,
      changeAmount: input.changeAmount ?? null,
      changeAmountHours: input.changeAmountHours ?? null,
      reason: input.reason,
      sourcePaymentId: input.sourcePaymentId ?? null,
      classInstanceId: input.classInstanceId ?? null,
      notes: input.notes ?? null,
      creditedByUserId: input.creditedByUserId,
      idempotencyKey: input.idempotencyKey,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!row) throw new DomainError("CREDIT_INSERT_FAILED", "Credit transaction insert returned no rows");
  return row;
};

export const createPurchaseImpl = async (
  tx: DBTransaction,
  input: {
    studentId: string;
    changeAmount: number;
    sourcePaymentId?: string | null;
    notes?: string | null;
    creditedByUserId: string;
    idempotencyKey: string;
  }
): Promise<CreditTransactionSelectType> =>
  insertCreditTransaction(tx, { ...input, reason: CreditReason.PURCHASE, classInstanceId: null });

export const deductForBookingImpl = async (
  tx: DBTransaction,
  input: {
    studentId: string;
    classInstanceId: string;
    creditedByUserId: string;
    idempotencyKey: string;
  }
): Promise<CreditTransactionSelectType> =>
  insertCreditTransaction(tx, {
    ...input,
    changeAmount: -1,
    reason: CreditReason.DEDUCTION,
    sourcePaymentId: null,
    notes: null,
  });

export const refundOnCancelImpl = async (
  tx: DBTransaction,
  input: {
    studentId: string;
    classInstanceId: string;
    creditedByUserId: string;
    idempotencyKey: string;
  }
): Promise<CreditTransactionSelectType> =>
  insertCreditTransaction(tx, {
    ...input,
    changeAmount: 1,
    reason: CreditReason.REFUND,
    sourcePaymentId: null,
    notes: null,
  });

// ─── Hour-based parallel ledger (credit-hours system) ────────────────────────
// Mirror of createPurchase/deductForBooking/refundOnCancel. These write NULL
// to changeAmount and store hours in changeAmountHours. NOTE: v1 has no
// production caller for booking variants (Plan 6 wires them) — intentional.

export const createHourPurchaseImpl = async (
  tx: DBTransaction,
  input: {
    studentId: string;
    hours: number;
    sourcePaymentId?: string | null;
    notes?: string | null;
    creditedByUserId: string;
    idempotencyKey: string;
  }
): Promise<CreditTransactionSelectType> => {
  const { hours, ...rest } = input;
  return insertCreditTransaction(tx, {
    ...rest,
    studentId: rest.studentId,
    reason: CreditReason.PURCHASE,
    classInstanceId: null,
    changeAmount: null,
    changeAmountHours: String(hours),
  });
};

export const deductHoursForBookingImpl = async (
  tx: DBTransaction,
  input: {
    studentId: string;
    classInstanceId: string;
    /** Positive duration in hours; stored negated in the ledger. */
    hours: number;
    creditedByUserId: string;
    idempotencyKey: string;
    notes?: string | null;
  }
): Promise<CreditTransactionSelectType> => {
  const { hours, notes, ...rest } = input;
  if (!Number.isFinite(hours) || hours <= 0) {
    throw new DomainError("INVALID_ARGS", "deductHoursForBooking requires a positive, non-zero hours amount");
  }
  return insertCreditTransaction(tx, {
    ...rest,
    reason: CreditReason.DEDUCTION,
    sourcePaymentId: null,
    notes: notes ?? null,
    changeAmount: null,
    changeAmountHours: String(-Math.abs(hours)),
  });
};

export const refundHoursOnCancelImpl = async (
  tx: DBTransaction,
  input: {
    studentId: string;
    classInstanceId: string;
    /** Positive hours to restore; stored positive in the ledger. */
    hours: number;
    creditedByUserId: string;
    idempotencyKey: string;
  }
): Promise<CreditTransactionSelectType> => {
  const { hours, ...rest } = input;
  return insertCreditTransaction(tx, {
    ...rest,
    reason: CreditReason.REFUND,
    sourcePaymentId: null,
    notes: null,
    changeAmount: null,
    changeAmountHours: String(Math.abs(hours)),
  });
};

/** ADJUSTMENT delta row for admin edits (delta may be negative). */
export const createHourAdjustmentImpl = async (
  tx: DBTransaction,
  input: {
    studentId: string;
    /** Positive = grant hours back; negative = reclaim hours. */
    delta: number;
    sourcePaymentId?: string | null;
    notes?: string | null;
    creditedByUserId: string;
    idempotencyKey: string;
  }
): Promise<CreditTransactionSelectType> => {
  const { delta, ...rest } = input;
  return insertCreditTransaction(tx, {
    studentId: rest.studentId,
    changeAmount: null,
    changeAmountHours: String(delta),
    reason: CreditReason.ADJUSTMENT,
    classInstanceId: null,
    sourcePaymentId: rest.sourcePaymentId ?? null,
    notes: rest.notes ?? null,
    creditedByUserId: rest.creditedByUserId,
    idempotencyKey: rest.idempotencyKey,
  });
};

/**
 * Admin credit adjustment row (ADD / SUBTRACT / SUBTRACT_WITH_CARRYOVER).
 * Unlike purchase/booking rows it also stamps the adjustment kind and, for
 * carryover adjustments, the carryover metadata consumed by the settlement
 * flow. Never linked to a payment or class instance.
 */
export const createAdjustmentImpl = async (
  tx: DBTransaction,
  input: CreditAdjustmentInsertInput
): Promise<CreditTransactionSelectType> => {
  const [row] = await tx
    .insert(creditTransactions)
    .values({
      studentId: input.studentId,
      changeAmount: input.changeAmount,
      reason: input.reason,
      adjustmentType: input.adjustmentType,
      carryoverTeacherId: input.carryoverTeacherId ?? null,
      carryoverFromDate: input.carryoverFromDate ?? null,
      carryoverToDate: input.carryoverToDate ?? null,
      carryoverPaymentDate: input.carryoverPaymentDate ?? null,
      sourcePaymentId: null,
      classInstanceId: null,
      notes: input.notes ?? null,
      internalNotes: input.internalNotes ?? null,
      creditedByUserId: input.creditedByUserId,
      idempotencyKey: input.idempotencyKey,
    })
    .returning();
  if (!row) throw new DomainError("INSERT_FAILED", "credit_transactions insert returned no row");
  return row;
};

/**
 * Batch multi-row insert of credit transactions. Deduplicates against existing
 * rows by `idempotencyKey` within the same call — only rows whose
 * `idempotencyKey` is not already present (from the `rows` set) are actually
 * inserted.
 */
export const insertBatchImpl = async (
  tx: DBTransaction,
  rows: CreditTransactionInsertType[]
): Promise<CreditTransactionSelectType[]> => {
  if (rows.length === 0) return [];

  const keys = rows.map(r => r.idempotencyKey);
  const existing = await findByIdempotencyKeysImpl(keys, tx);
  const existingKeys = new Set(existing.map(r => r.idempotencyKey));
  const toInsert = rows.filter(r => !existingKeys.has(r.idempotencyKey));
  if (toInsert.length === 0) return [];

  const now = new Date();
  const values = toInsert.map(r => ({
    studentId: r.studentId,
    changeAmount: r.changeAmount,
    reason: r.reason,
    sourcePaymentId: r.sourcePaymentId ?? null,
    classInstanceId: r.classInstanceId ?? null,
    notes: r.notes ?? null,
    creditedByUserId: r.creditedByUserId,
    idempotencyKey: r.idempotencyKey,
    createdAt: now,
    updatedAt: now,
  }));

  return tx.insert(creditTransactions).values(values).returning();
};

export const generateIdempotencyKeyImpl = (input: {
  studentId: string;
  hours: number;
  notes?: string;
  sourcePaymentId?: string | null;
}): string => {
  const content = JSON.stringify({
    studentId: input.studentId,
    hours: input.hours,
    notes: input.notes ?? "",
    sourcePaymentId: input.sourcePaymentId ?? "none",
  });
  // Deterministic prefix: sha256 of the source content. Using a random UUID
  // prefix would break idempotency (two calls with identical inputs would
  // produce different keys, defeating the unique-contract dedup mechanism).
  const prefix = createHash("sha256").update(content).digest("hex").slice(0, 36);
  return `${prefix}-credit-${Buffer.from(content).toString("base64").slice(0, 24)}`;
};
