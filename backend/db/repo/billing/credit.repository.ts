import { createHash } from "node:crypto";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { queryWithPagination } from "@/backend/db/query.extensions";
import { creditTransactions, students } from "@/backend/db/schema";
import { CreditReason } from "@/backend/enum";
import type { CreditInsertInput, CreditTransactionSelectType, PaginationArgs } from "@/backend/types";

type ReadExecutor = DBTransaction | typeof db;

export namespace CreditRepository {
  export const getBalance = async (
    tx: ReadExecutor,
    studentId: string
  ): Promise<{ classesTotal: number; classesRemaining: number }> => {
    const [row] = await tx
      .select({
        classesTotal: students.classesTotal,
        classesRemaining: students.classesRemaining,
      })
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);
    return {
      classesTotal: row?.classesTotal ?? 0,
      classesRemaining: row?.classesRemaining ?? 0,
    };
  };

  export const getTransactions = async (
    tx: ReadExecutor,
    studentId: string,
    paginationArgs?: PaginationArgs | null
  ): Promise<CreditTransactionSelectType[]> => {
    const baseQuery = tx
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.studentId, studentId))
      .orderBy(desc(creditTransactions.createdAt))
      .$dynamic();
    const paginated = queryWithPagination(baseQuery, paginationArgs);
    return paginated;
  };

  export const countTransactions = async (tx: ReadExecutor, studentId: string): Promise<number> => {
    const [row] = await tx
      .select({ value: count() })
      .from(creditTransactions)
      .where(eq(creditTransactions.studentId, studentId));
    return Number(row?.value ?? 0);
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
    if (!row) throw new Error("Credit transaction insert returned no rows");
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
    const queryDb = tx ?? db;
    return queryDb
      .select()
      .from(creditTransactions)
      .where(inArray(creditTransactions.idempotencyKey, [...keys]));
  };

  export const findByClassInstanceId = async (
    tx: ReadExecutor,
    classInstanceId: string,
    reason?: CreditReason
  ): Promise<CreditTransactionSelectType[]> => {
    const whereCondition = reason
      ? and(eq(creditTransactions.classInstanceId, classInstanceId), eq(creditTransactions.reason, reason))
      : eq(creditTransactions.classInstanceId, classInstanceId);
    return tx.select().from(creditTransactions).where(whereCondition);
  };

  export const aggregateBalanceFromLedger = async (
    tx: ReadExecutor,
    studentId: string
  ): Promise<{ classesTotal: number; classesRemaining: number }> => {
    const [row] = await tx
      .select({
        classesTotal: sql<number>`COALESCE(SUM(CASE WHEN ${creditTransactions.reason} = 'PURCHASE' THEN ${creditTransactions.changeAmount} ELSE 0 END), 0)::int`,
        classesRemaining: sql<number>`COALESCE(SUM(${creditTransactions.changeAmount}), 0)::int`,
      })
      .from(creditTransactions)
      .where(eq(creditTransactions.studentId, studentId));
    return {
      classesTotal: Number(row?.classesTotal ?? 0),
      classesRemaining: Number(row?.classesRemaining ?? 0),
    };
  };

  export const generateIdempotencyKey = (input: { studentId: string; hours: number; notes?: string }): string => {
    const content = JSON.stringify({
      studentId: input.studentId,
      hours: input.hours,
      notes: input.notes ?? "",
    });
    // Deterministic prefix: sha256 of the source content. Using a random UUID
    // prefix would break idempotency (two calls with identical inputs would
    // produce different keys, defeating the unique-contract dedup mechanism).
    const prefix = createHash("sha256").update(content).digest("hex").slice(0, 36);
    return `${prefix}-credit-${Buffer.from(content).toString("base64").slice(0, 24)}`;
  };
}
