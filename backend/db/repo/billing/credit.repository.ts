import { createHash } from "node:crypto";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/types";
import type { db } from "@/backend/db/drizzleDb";
import { queryWithPagination } from "@/backend/db/query.extensions";
import { creditTransactions, students } from "@/backend/db/schema";
import { CreditReason } from "@/backend/enum";
import { DomainError } from "@/backend/lib/errors";
import type { CreditInsertInput, CreditTransactionSelectType } from "@/backend/types";
import { PaginationArgs } from "@/backend/types";

// NOTE: Overload-by-type-discrimination — tx parameter is polymorphic: string (studentId) or Transaction instance. Callers must be aware that getBalance(tx, undefined) silently targets the wrong studentId.
type ReadExecutor = DBTransaction | typeof db;

/** Type guard: narrows unknown to CreditReason by checking against enum values. */
const isCreditReason = (value: unknown): value is CreditReason =>
  typeof value === "string" && (Object.values(CreditReason) as readonly string[]).includes(value);

export namespace CreditRepository {
  export const getBalance = async (
    tx?: ReadExecutor,
    studentId?: string
  ): Promise<{ classesTotal: number; classesRemaining: number }> => {
    const targetStudentId = studentId ?? (typeof tx === "string" ? tx : undefined);
    if (!targetStudentId) {
      throw new DomainError("INVALID_ARGS", "studentId is required when tx is not a string");
    }
    const q = queryDb(typeof tx === "string" ? undefined : tx);
    const [row] = await q
      .select({
        classesTotal: students.classesTotal,
        classesRemaining: students.classesRemaining,
      })
      .from(students)
      .where(eq(students.id, targetStudentId))
      .limit(1);
    return {
      classesTotal: row?.classesTotal ?? 0,
      classesRemaining: row?.classesRemaining ?? 0,
    };
  };

  export const getTransactions = async (
    tx: ReadExecutor | string,
    studentId?: string | PaginationArgs | null,
    paginationArgs?: PaginationArgs | null
  ): Promise<CreditTransactionSelectType[]> => {
    const actualTx = typeof tx === "string" ? undefined : tx;
    const actualStudentId = typeof tx === "string" ? tx : studentId;
    if (typeof actualStudentId !== "string") {
      throw new DomainError("INVALID_ARGS", "studentId must be a string when tx is not a string");
    }
    const actualPagination =
      typeof tx === "string" ? (studentId instanceof PaginationArgs ? studentId : null) : paginationArgs;
    const q = queryDb(actualTx);
    const baseQuery = q
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.studentId, actualStudentId))
      .orderBy(desc(creditTransactions.createdAt))
      .$dynamic();
    const paginated = queryWithPagination(baseQuery, actualPagination);
    return paginated;
  };

  export const countTransactions = async (tx: ReadExecutor | string, studentId?: string): Promise<number> => {
    const actualTx = typeof tx === "string" ? undefined : tx;
    const actualStudentId = typeof tx === "string" ? tx : studentId;
    if (typeof actualStudentId !== "string") {
      throw new DomainError("INVALID_ARGS", "studentId must be a string when tx is not a string");
    }
    const q = queryDb(actualTx);
    const [row] = await q
      .select({ value: count() })
      .from(creditTransactions)
      .where(eq(creditTransactions.studentId, actualStudentId));
    return row?.value ?? 0;
  };

  const insertCreditTransaction = async (
    tx: DBTransaction,
    input: CreditInsertInput
  ): Promise<CreditTransactionSelectType> => {
    const now = new Date();
    const [row] = await tx
      .insert(creditTransactions)
      .values({
        studentId: input.studentId,
        changeAmount: input.changeAmount,
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
    rows: CreditInsertInput[]
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
    const actualReason =
      typeof tx === "string" ? (isCreditReason(classInstanceId) ? classInstanceId : undefined) : reason;
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
        classesTotal: sql<number>`COALESCE(SUM(CASE WHEN ${creditTransactions.reason} = 'PURCHASE' THEN ${creditTransactions.changeAmount} ELSE 0 END), 0)::int`,
        classesRemaining: sql<number>`COALESCE(SUM(${creditTransactions.changeAmount}), 0)::int`,
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
