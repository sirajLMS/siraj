import { desc, eq, inArray, sql } from "drizzle-orm";
import { type db, queryDb, queryWithPagination } from "@/backend/db";
import { quotaLedger } from "@/backend/db/schema";
import type { QuotaLedgerReason } from "@/backend/enum";
import { QuotaLedgerError } from "@/backend/lib/errors";
import type { DBTransaction, PaginationArgs, QuotaLedgerSelectType } from "@/backend/types";

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
    // Atomic idempotency: INSERT ... ON CONFLICT (idempotency_key) DO NOTHING
    // If the row already exists (conflict), the insert returns no rows and we
    // fetch the existing record. This eliminates the TOCTOU race between the
    // separate SELECT and INSERT that was present in the previous implementation.
    // AUDIT: ledger entry required for tracking and balance reconstruction
    const now = new Date();
    const [inserted] = await tx
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
      .onConflictDoNothing({ target: quotaLedger.idempotencyKey })
      .returning();

    if (inserted) return inserted;

    // Conflict — a row with this idempotency key already exists; fetch it.
    const [existing] = await tx
      .select()
      .from(quotaLedger)
      .where(eq(quotaLedger.idempotencyKey, input.idempotencyKey))
      .limit(1);

    if (!existing) throw new QuotaLedgerError("Quota ledger insert returned no rows and no existing row found");
    return existing;
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
    // AUDIT: ledger entries required for batch tracking and balance reconstruction
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
      .onConflictDoNothing({ target: quotaLedger.idempotencyKey })
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
    return row?.value ?? 0;
  };

  export const computeBalance = async (
    tx: ReadExecutor,
    quotaId: string
  ): Promise<{ remaining: number; reservedClasses: number }> => {
    const q = queryDb(tx);
    const [row] = await q
      .select({
        netSum: sql<number>`COALESCE(SUM(${quotaLedger.delta}), 0)::int`,
        reservedSum: sql<number>`COALESCE(SUM(CASE WHEN ${quotaLedger.reason} = 'RESERVE' THEN ${quotaLedger.delta} WHEN ${quotaLedger.reason} = 'RELEASE' AND ${quotaLedger.classInstanceId} IS NULL THEN ${quotaLedger.delta} ELSE 0 END), 0)::int`,
      })
      .from(quotaLedger)
      .where(eq(quotaLedger.quotaId, quotaId));
    return {
      remaining: Math.max(0, row?.netSum ?? 0),
      reservedClasses: Math.max(0, Math.abs(row?.reservedSum ?? 0)),
    };
  };
}
