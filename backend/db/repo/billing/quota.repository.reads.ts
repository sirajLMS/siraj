import { and, desc, eq, gt, gte, inArray, isNull, or, sql } from "drizzle-orm";

import { queryDb, withForUpdate } from "@/backend/db";
import {
  buildQuotaFilterConditions,
  type ReadExecutor,
  runPaginatedQuotaList,
} from "@/backend/db/repo/billing/quota.repository.helpers";
import { quotas } from "@/backend/db/schema";
import { QuotaStatus } from "@/backend/enum";
import { mapQuotaToReturnType } from "@/backend/lib/quota-mapping";
import type {
  DBTransaction,
  PaginationArgs,
  QuotaPaginatedFilter,
  QuotaReturnType,
  QuotaSelectType,
} from "@/backend/types";

export const findByIdImpl = async (tx?: ReadExecutor, id?: string): Promise<QuotaSelectType | null> => {
  if (!id) return null;
  const q = queryDb(tx);
  const [row] = await q
    .select()
    .from(quotas)
    .where(and(eq(quotas.id, id), isNull(quotas.deletedAt)))
    .limit(1);
  return row ?? null;
};

export const listByStudentImpl = async (
  tx?: ReadExecutor,
  studentId?: string,
  limit = 100
): Promise<QuotaSelectType[]> => {
  if (!studentId) return [];
  const q = queryDb(tx);
  return q
    .select()
    .from(quotas)
    .where(and(eq(quotas.studentId, studentId), isNull(quotas.deletedAt)))
    .orderBy(desc(quotas.createdAt))
    .limit(limit);
};

export const listActiveByStudentImpl = async (tx?: ReadExecutor, studentId?: string): Promise<QuotaSelectType[]> => {
  if (!studentId) return [];
  const q = queryDb(tx);
  return q
    .select()
    .from(quotas)
    .where(
      and(
        eq(quotas.studentId, studentId),
        eq(quotas.status, QuotaStatus.ACTIVE),
        gt(quotas.remaining, 0),
        isNull(quotas.deletedAt)
      )
    )
    .orderBy(desc(quotas.priority), quotas.validUntil, quotas.createdAt)
    .limit(100); // Capped at 100 to prevent unbounded results
};

/**
 * Returns a paginated list of non-deleted quotas with optional filtering
 * and the total count of matching rows.
 */
export const listAllPaginatedImpl = async (
  tx?: ReadExecutor,
  filter?: QuotaPaginatedFilter | null,
  pagination?: PaginationArgs | null
): Promise<{ rows: QuotaSelectType[]; totalCount: number }> =>
  runPaginatedQuotaList(tx, buildQuotaFilterConditions(filter), pagination);

/**
 * Returns a paginated list of non-deleted quotas restricted to the given
 * student IDs, with the same filter and pagination shape as
 * {@link listAllPaginatedImpl}.
 *
 * Student scoping happens in SQL via `inArray(quotas.studentId, ids)` so
 * pagination and totalCount operate on the scoped set — callers never need
 * to fetch all quotas and filter in memory. Uses a plain array with a
 * dynamic query (NOT `sql.placeholder`): the PostgreSQL prepared-statement
 * protocol cannot expand array parameters for `IN` clauses.
 */
export const listByStudentIdsPaginatedImpl = async (
  tx?: ReadExecutor,
  studentIds?: string[] | null,
  filter?: QuotaPaginatedFilter | null,
  pagination?: PaginationArgs | null
): Promise<{ rows: QuotaSelectType[]; totalCount: number }> => {
  if (!studentIds || studentIds.length === 0) return { rows: [], totalCount: 0 };

  const conditions = buildQuotaFilterConditions(filter);
  conditions.push(inArray(quotas.studentId, [...new Set(studentIds)]));

  return runPaginatedQuotaList(tx, conditions, pagination);
};

/**
 * Lists ACTIVE, non-deleted PERIODIC quotas that have a rolloverPolicy and have passed
 * their current period end — ready for sweeper to perform rollover.
 */
export const listPeriodicForRolloverImpl = async (tx: DBTransaction): Promise<QuotaReturnType[]> => {
  const now = new Date();
  // Period end = periodAnchor + periodDays. We want quotas where "now > periodEnd".
  const periodEndExpr = sql<Date>`${quotas.periodAnchor} + make_interval(days => ${quotas.periodDays})`;
  const rows = await tx
    .select()
    .from(quotas)
    .where(
      and(
        eq(quotas.kind, "PERIODIC"),
        eq(quotas.status, QuotaStatus.ACTIVE),
        isNull(quotas.deletedAt),
        sql`${quotas.rolloverPolicy} IS NOT NULL`,
        sql`${periodEndExpr} < ${now}`
      )
    )
    .limit(500); // Capped at 500 per cron tick
  return rows.map(mapQuotaToReturnType);
};

/**
 * Internal-only: selects the best quota to book against using FIFO ordering.
 *
 * **Do NOT call directly from services or GraphQL resolvers.** This method
 * is intended to be used exclusively by {@link QuotaService.selectQuotaForBooking}
 * which performs permission gating and orchestration around it.
 *
 * Uses `FOR UPDATE` row locking (`SELECT ... FOR UPDATE`) to prevent
 * concurrent reads from selecting the same quota, avoiding oversell under
 * contention.
 *
 * FIFO selection ordering:
 * 1. `priority` DESC — higher-priority quotas are consumed first.
 * 2. `validUntil` ASC — quotas expiring sooner are consumed first.
 * 3. `createdAt` ASC — older quotas are consumed first as a tiebreaker.
 *
 * Only filters ACTIVE quotas with `remaining > 0`, no soft-delete, and
 * either no expiry (`validUntil IS NULL`) or not yet expired.
 *
 * **Must be called within a transaction** (`tx`) — the `FOR UPDATE` lock
 * is only meaningful inside a transaction and the returned quota row is
 * expected to be mutated (redeem/reserve) within the same transaction.
 */
export const selectQuotaForBookingFIFOImpl = async (
  tx: DBTransaction,
  studentId: string
): Promise<QuotaSelectType | null> => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [quotaRow] = await withForUpdate(
    tx
      .select()
      .from(quotas)
      .where(
        and(
          eq(quotas.studentId, studentId),
          eq(quotas.status, QuotaStatus.ACTIVE),
          gt(quotas.remaining, 0),
          isNull(quotas.deletedAt),
          or(isNull(quotas.validUntil), gte(quotas.validUntil, todayStr))
        )
      )
      .orderBy(desc(quotas.priority), quotas.validUntil, quotas.createdAt)
  ).limit(1);

  return quotaRow ?? null;
};
