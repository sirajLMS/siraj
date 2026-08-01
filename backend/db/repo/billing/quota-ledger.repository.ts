import { desc, eq, inArray, sql } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/db/db.types";
import type { db } from "@/backend/db/drizzleDb";
import { queryWithPagination } from "@/backend/db/query.extensions";
import { quotaLedger } from "@/backend/db/schema";
import type { QuotaLedgerReason } from "@/backend/enum";
import type { QuotaLedgerSelectType } from "@/backend/types/billing/quota.types";
import type { PaginationArgs } from "@/backend/types/shared/pagination.types";

type ReadExecutor = DBTransaction | typeof db;

export namespace QuotaLedgerRepository {
  export const insert = async (
    tx: DBTransaction,
    input: {
      quotaId: string;
      studentId: string;
      recurringScheduleId?: string | null;
      classInstanceId?: string | null;
      delta: number;
      reason: QuotaLedgerReason;
      reasonNote?: string | null;
      actorUserId?: string | null;
      idempotencyKey: string;
    }
  ): Promise<QuotaLedgerSelectType> => {
    // Check for existing idempotency key first to avoid unique constraint violations
    // that would roll back the parent transaction (including the atomic quota update)
    const [existing] = await tx
      .select()
      .from(quotaLedger)
      .where(eq(quotaLedger.idempotencyKey, input.idempotencyKey))
      .limit(1);

    if (existing) return existing;

    const now = new Date();
    const [row] = await tx
      .insert(quotaLedger)
      .values({
        quotaId: input.quotaId,
        studentId: input.studentId,
        recurringScheduleId: input.recurringScheduleId ?? null,
        classInstanceId: input.classInstanceId ?? null,
        delta: input.delta,
        reason: input.reason,
        reasonNote: input.reasonNote ?? null,
        actorUserId: input.actorUserId ?? null,
        idempotencyKey: input.idempotencyKey,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!row) throw new Error("Quota ledger insert returned no rows");
    return row;
  };

  export const insertBatch = async (
    tx: DBTransaction,
    rows: {
      quotaId: string;
      studentId: string;
      recurringScheduleId?: string | null;
      classInstanceId?: string | null;
      delta: number;
      reason: QuotaLedgerReason;
      reasonNote?: string | null;
      actorUserId?: string | null;
      idempotencyKey: string;
    }[]
  ): Promise<QuotaLedgerSelectType[]> => {
    if (rows.length === 0) return [];

    const keys = rows.map(r => r.idempotencyKey);

    // ONE SELECT to find which idempotency keys already exist
    const existing = await tx
      .select({ idempotencyKey: quotaLedger.idempotencyKey })
      .from(quotaLedger)
      .where(inArray(quotaLedger.idempotencyKey, keys));

    const existingSet = new Set(
      existing.map(r => (typeof r.idempotencyKey === "string" ? r.idempotencyKey : String(r.idempotencyKey)))
    );
    const unseenRows = rows.filter(r => !existingSet.has(r.idempotencyKey));

    // ONE multi-row INSERT for all unseen rows
    if (unseenRows.length === 0) return [];

    const now = new Date();
    const inserted = await tx
      .insert(quotaLedger)
      .values(
        unseenRows.map(r => ({
          quotaId: r.quotaId,
          studentId: r.studentId,
          recurringScheduleId: r.recurringScheduleId ?? null,
          classInstanceId: r.classInstanceId ?? null,
          delta: r.delta,
          reason: r.reason,
          reasonNote: r.reasonNote ?? null,
          actorUserId: r.actorUserId ?? null,
          idempotencyKey: r.idempotencyKey,
          createdAt: now,
          updatedAt: now,
        }))
      )
      .returning();

    return inserted;
  };

  export const findByQuotaId = async (
    tx?: ReadExecutor,
    quotaId?: string,
    pagination?: PaginationArgs | null
  ): Promise<QuotaLedgerSelectType[]> => {
    const q = queryDb(tx);
    if (!quotaId) return [];
    const baseQuery = q
      .select()
      .from(quotaLedger)
      .where(eq(quotaLedger.quotaId, quotaId))
      .orderBy(desc(quotaLedger.createdAt))
      .$dynamic();
    return queryWithPagination(baseQuery, pagination);
  };

  export const countByQuotaId = async (tx?: ReadExecutor, quotaId?: string): Promise<number> => {
    if (!quotaId) return 0;
    const q = queryDb(tx);
    const [row] = await q
      .select({ value: sql<number>`count(*)::int` })
      .from(quotaLedger)
      .where(eq(quotaLedger.quotaId, quotaId));
    return Number(row?.value ?? 0);
  };

  export const findByClassInstanceId = async (
    tx: ReadExecutor,
    classInstanceId: string
  ): Promise<QuotaLedgerSelectType[]> => {
    const q = queryDb(tx);
    return q
      .select()
      .from(quotaLedger)
      .where(eq(quotaLedger.classInstanceId, classInstanceId))
      .orderBy(desc(quotaLedger.createdAt));
  };

  export const findByRecurringScheduleId = async (
    tx: ReadExecutor,
    recurringScheduleId: string
  ): Promise<QuotaLedgerSelectType[]> => {
    const q = queryDb(tx);
    return q
      .select()
      .from(quotaLedger)
      .where(eq(quotaLedger.recurringScheduleId, recurringScheduleId))
      .orderBy(desc(quotaLedger.createdAt));
  };

  export const findByIdempotencyKey = async (tx: ReadExecutor, key: string): Promise<QuotaLedgerSelectType | null> => {
    const q = queryDb(tx);
    const [row] = await q.select().from(quotaLedger).where(eq(quotaLedger.idempotencyKey, key)).limit(1);
    return row ?? null;
  };

  export const computeBalance = async (
    tx: ReadExecutor,
    quotaId: string
  ): Promise<{ remaining: number; reservedClasses: number }> => {
    const q = queryDb(tx);
    const [row] = await q
      .select({
        netSum: sql<number>`COALESCE(SUM(${quotaLedger.delta}), 0)::int`,
        reservedSum: sql<number>`COALESCE(SUM(CASE WHEN ${quotaLedger.reason} = 'RESERVE' THEN ${quotaLedger.delta} WHEN ${quotaLedger.reason} = 'RELEASE' AND ${quotaLedger.recurringScheduleId} IS NOT NULL AND ${quotaLedger.classInstanceId} IS NULL THEN ${quotaLedger.delta} ELSE 0 END), 0)::int`,
      })
      .from(quotaLedger)
      .where(eq(quotaLedger.quotaId, quotaId));
    return {
      remaining: Math.max(0, Number(row?.netSum ?? 0)),
      reservedClasses: Math.max(0, Math.abs(Number(row?.reservedSum ?? 0))),
    };
  };
}
