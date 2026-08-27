import { createHash } from "node:crypto";
import { and, asc, count, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { type db, queryDb, queryWithPagination } from "@/backend/db";
import { creditTransactions, students } from "@/backend/db/schema";
import { CreditReason } from "@/backend/enum";
import { DomainError } from "@/backend/lib/errors";
import {
  type CreditTransactionInsertType,
  type CreditTransactionSelectType,
  type DBTransaction,
  PaginationArgs,
} from "@/backend/types";

// NOTE: Overload-by-type-discrimination — tx parameter is polymorphic: string (studentId) or Transaction instance. Callers must be aware that getBalance(tx, undefined) silently targets the wrong studentId.
type ReadExecutor = DBTransaction | typeof db;

/** Resolves the polymorphic (tx | studentId) argument pair used by balance getters. */
function resolveStudentScope(tx: ReadExecutor | string | undefined, studentId?: string) {
  const targetStudentId = studentId ?? (typeof tx === "string" ? tx : undefined);
  if (!targetStudentId) {
    throw new DomainError("INVALID_ARGS", "studentId is required when tx is not a string");
  }
  return { targetStudentId, executor: typeof tx === "string" ? undefined : tx };
}

/** Shared quota row fetch backing both the class-count and hour balance getters. */
async function fetchStudentQuotaRow(executor: ReadExecutor | undefined, targetStudentId: string) {
  const q = queryDb(executor);
  const [row] = await q
    .select({
      classesTotal: students.classesTotal,
      classesRemaining: students.classesRemaining,
      creditHoursTotal: students.creditHoursTotal,
      creditHoursRemaining: students.creditHoursRemaining,
    })
    .from(students)
    .where(eq(students.id, targetStudentId))
    .limit(1);
  return row;
}

/** Type guard: narrows unknown to CreditReason by checking against enum values. */
const isCreditReason = (value: unknown): value is CreditReason =>
  typeof value === "string" && (Object.values(CreditReason) as readonly string[]).includes(value);

export namespace CreditRepository {
  /** Thin adapter over getStudentQuotaBalances (class-count view). */
  export const getBalance = async (
    tx?: ReadExecutor,
    studentId?: string
  ): Promise<{ classesTotal: number; classesRemaining: number }> => {
    const balances = await getStudentQuotaBalances(tx, studentId);
    return { classesTotal: balances.classesTotal, classesRemaining: balances.classesRemaining };
  };

  /** Thin adapter over getStudentQuotaBalances (hour view). */
  export const getHourBalance = async (
    tx?: ReadExecutor,
    studentId?: string
  ): Promise<{ creditHoursTotal: string; creditHoursRemaining: string }> => {
    const balances = await getStudentQuotaBalances(tx, studentId);
    return { creditHoursTotal: balances.creditHoursTotal, creditHoursRemaining: balances.creditHoursRemaining };
  };

  /** Single source of truth for both balance views (avoids query duplication). */
  export const getStudentQuotaBalances = async (
    tx?: ReadExecutor,
    studentId?: string
  ): Promise<{
    classesTotal: number;
    classesRemaining: number;
    creditHoursTotal: string;
    creditHoursRemaining: string;
  }> => {
    const { targetStudentId, executor } = resolveStudentScope(tx, studentId);
    const row = await fetchStudentQuotaRow(executor, targetStudentId);
    return {
      classesTotal: row?.classesTotal ?? 0,
      classesRemaining: row?.classesRemaining ?? 0,
      creditHoursTotal: row?.creditHoursTotal ?? "0",
      creditHoursRemaining: row?.creditHoursRemaining ?? "0",
    };
  };

  export const getTransactions = async (
    tx: ReadExecutor | string,
    studentId?: string | PaginationArgs | null,
    paginationArgs?: PaginationArgs | null,
    opts?: { hoursOnly?: boolean }
  ): Promise<CreditTransactionSelectType[]> => {
    const actualTx = typeof tx === "string" ? undefined : tx;
    const actualStudentId = typeof tx === "string" ? tx : studentId;
    if (typeof actualStudentId !== "string") {
      throw new DomainError("INVALID_ARGS", "studentId must be a string when tx is not a string");
    }
    let actualPagination: PaginationArgs | null;
    if (typeof tx === "string") {
      actualPagination = studentId instanceof PaginationArgs ? studentId : null;
    } else {
      actualPagination = paginationArgs ?? null;
    }
    const q = queryDb(actualTx);
    // hoursOnly narrows to the hour-based parallel ledger rows (XOR: exactly
    // one of changeAmount / changeAmountHours is set — Task 8.9).
    const whereClause = opts?.hoursOnly
      ? and(eq(creditTransactions.studentId, actualStudentId), isNotNull(creditTransactions.changeAmountHours))
      : eq(creditTransactions.studentId, actualStudentId);
    const baseQuery = q
      .select()
      .from(creditTransactions)
      .where(whereClause)
      .orderBy(desc(creditTransactions.createdAt))
      .$dynamic();
    const paginated = queryWithPagination(baseQuery, actualPagination);
    return paginated;
  };

  /** All ledger rows generated by one accounting payment (detail history). */
  export const listBySourcePaymentId = async (
    sourcePaymentId: string,
    tx?: DBTransaction
  ): Promise<CreditTransactionSelectType[]> => {
    const q = queryDb(tx);
    return q
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.sourcePaymentId, sourcePaymentId))
      .orderBy(asc(creditTransactions.createdAt));
  };

  export const countTransactions = async (
    tx: ReadExecutor | string,
    studentId?: string,
    opts?: { hoursOnly?: boolean }
  ): Promise<number> => {
    const actualTx = typeof tx === "string" ? undefined : tx;
    const actualStudentId = typeof tx === "string" ? tx : studentId;
    if (typeof actualStudentId !== "string") {
      throw new DomainError("INVALID_ARGS", "studentId must be a string when tx is not a string");
    }
    const q = queryDb(actualTx);
    const whereClause = opts?.hoursOnly
      ? and(eq(creditTransactions.studentId, actualStudentId), isNotNull(creditTransactions.changeAmountHours))
      : eq(creditTransactions.studentId, actualStudentId);
    const [row] = await q.select({ value: count() }).from(creditTransactions).where(whereClause);
    return row?.value ?? 0;
  };

  const insertCreditTransaction = async (
    tx: DBTransaction,
    input: CreditTransactionInsertType
  ): Promise<CreditTransactionSelectType> => {
    // XOR invariant: a row must carry EITHER classes OR hours — never both,
    // never neither (mirrors the DB CHECK constraint as an early failure).
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

  export const createPurchase = async (
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

  export const deductForBooking = async (
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

  export const refundOnCancel = async (
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

  export const createHourPurchase = async (
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

  export const deductHoursForBooking = async (
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

  export const refundHoursOnCancel = async (
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
  export const createHourAdjustment = async (
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

  export const findByIdempotencyKeys = async (
    keys: string[],
    tx?: DBTransaction
  ): Promise<CreditTransactionSelectType[]> => {
    if (keys.length === 0) return [];
    const q = queryDb(tx);
    return q
      .select()
      .from(creditTransactions)
      .where(inArray(creditTransactions.idempotencyKey, [...keys]));
  };

  /**
   * Batch multi-row insert of credit transactions. Deduplicates against
   * existing rows by `idempotencyKey` within the same call — only rows
   * whose `idempotencyKey` is not already present (from the `rows` set)
   * are actually inserted.
   */
  export const insertBatch = async (
    tx: DBTransaction,
    rows: CreditTransactionInsertType[]
  ): Promise<CreditTransactionSelectType[]> => {
    if (rows.length === 0) return [];

    const keys = rows.map(r => r.idempotencyKey);
    const existing = await findByIdempotencyKeys(keys, tx);
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

  export const findByClassInstanceId = async (
    tx: ReadExecutor | string,
    classInstanceId?: string | CreditReason,
    reason?: CreditReason
  ): Promise<CreditTransactionSelectType[]> => {
    const actualTx = typeof tx === "string" ? undefined : tx;
    const actualClassId = typeof tx === "string" ? tx : classInstanceId;
    if (typeof actualClassId !== "string") {
      throw new DomainError("INVALID_ARGS", "classInstanceId must be a string when tx is not a string");
    }
    let actualReason: CreditReason | undefined;
    if (typeof tx === "string") {
      actualReason = isCreditReason(classInstanceId) ? classInstanceId : undefined;
    } else {
      actualReason = reason;
    }
    const q = queryDb(actualTx);
    const whereCondition = actualReason
      ? and(eq(creditTransactions.classInstanceId, actualClassId), eq(creditTransactions.reason, actualReason))
      : eq(creditTransactions.classInstanceId, actualClassId);
    return q.select().from(creditTransactions).where(whereCondition);
  };

  export const aggregateBalanceFromLedger = async (
    tx: ReadExecutor | string,
    studentId?: string
  ): Promise<{ classesTotal: number; classesRemaining: number }> => {
    const actualTx = typeof tx === "string" ? undefined : tx;
    const actualStudentId = typeof tx === "string" ? tx : studentId;
    if (typeof actualStudentId !== "string") {
      throw new DomainError("INVALID_ARGS", "studentId must be a string when tx is not a string");
    }
    const q = queryDb(actualTx);
    const [row] = await q
      .select({
        classesTotal:
          sql<number>`COALESCE(SUM(CASE WHEN ${creditTransactions.reason} = 'PURCHASE' THEN ${creditTransactions.changeAmount} ELSE 0 END), 0)`.mapWith(
            Number
          ),
        classesRemaining: sql<number>`COALESCE(SUM(${creditTransactions.changeAmount}), 0)`.mapWith(Number),
      })
      .from(creditTransactions)
      .where(eq(creditTransactions.studentId, actualStudentId));
    return {
      classesTotal: row?.classesTotal ?? 0,
      classesRemaining: row?.classesRemaining ?? 0,
    };
  };

  export const generateIdempotencyKey = (input: {
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
}
