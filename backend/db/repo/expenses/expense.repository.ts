import { and, desc, eq, gte, inArray, isNull, lte, type SQL, sql } from "drizzle-orm";
import { caseInsensitiveLike, db, queryDb, withForUpdate } from "@/backend/db";
import { expenses, users } from "@/backend/db/schema";
import type {
  DBTransaction,
  ExpenseFilters,
  ExpenseInsertType,
  ExpensePageResult,
  ExpenseSelectType,
  ExpenseUpdatePatch,
} from "@/backend/types";
import { escapeLikeWildcards } from "@/backend/utils";

export namespace ExpenseRepository {
  function buildConditions(filters: ExpenseFilters): SQL[] {
    const conditions: SQL[] = [];
    const title = filters.title?.trim();
    if (title) {
      conditions.push(caseInsensitiveLike(expenses.title, `%${escapeLikeWildcards(title)}%`));
    }
    if (filters.types && filters.types.length > 0) {
      conditions.push(inArray(expenses.type, [...filters.types]));
    }
    if (filters.expenseDate) {
      conditions.push(eq(expenses.expenseDate, filters.expenseDate));
    }
    // paymentDate values are ISO calendar dates (YYYY-MM-DD) stored as text,
    // so lexicographic comparison matches chronological ordering.
    if (filters.paymentDateFrom) {
      conditions.push(gte(expenses.paymentDate, filters.paymentDateFrom));
    }
    if (filters.paymentDateTo) {
      conditions.push(lte(expenses.paymentDate, filters.paymentDateTo));
    }
    if (!filters.includeDeleted) {
      conditions.push(isNull(expenses.deletedAt));
    }
    return conditions;
  }

  async function countFiltered(conditions: SQL[], tx?: DBTransaction): Promise<number> {
    const q = queryDb(tx);
    const [row] = await q
      .select({ totalCount: sql<number>`count(*)`.mapWith(Number) })
      .from(expenses)
      .where(and(...conditions));
    return row?.totalCount ?? 0;
  }

  /**
   * Paginated, filtered expense list with the creator's display name resolved
   * by join. `totalCount` counts the full filtered set (before limit/offset)
   * so callers can render pagination controls. Read aggregates (total value,
   * dominant currency, row count by type) are derived by the caller from the
   * rows. Newest first; the id tiebreak keeps pagination deterministic.
   */
  export async function findFiltered(
    filters: ExpenseFilters,
    pagination: { limit: number; offset: number },
    tx?: DBTransaction
  ): Promise<ExpensePageResult> {
    const conditions = buildConditions(filters);
    const q = queryDb(tx);

    const pageRows = await q
      .select({ expense: expenses, createdByName: users.name })
      .from(expenses)
      .innerJoin(users, eq(expenses.createdByUserId, users.id))
      .where(and(...conditions))
      .orderBy(desc(expenses.createdAt), expenses.id)
      .limit(pagination.limit)
      .offset(pagination.offset);

    const totalCount = await countFiltered(conditions, tx);

    return {
      rows: pageRows.map(row => Object.assign(row.expense, { createdByName: row.createdByName })),
      totalCount,
    };
  }

  export async function getById(id: string, tx?: DBTransaction): Promise<ExpenseSelectType | null> {
    const q = queryDb(tx);
    const [row] = await q.select().from(expenses).where(eq(expenses.id, id)).limit(1);
    return row ?? null;
  }

  /**
   * Locking single-row read: takes an exclusive row lock (`FOR UPDATE` on
   * PostgreSQL) until the caller's transaction ends, so follow-up writes
   * (update / soft-delete) cannot race a concurrent mutation. Must be called
   * inside a transaction — a lock acquired outside one releases immediately.
   */
  export async function getByIdForUpdate(id: string, tx: DBTransaction): Promise<ExpenseSelectType | null> {
    const [row] = await withForUpdate(tx.select().from(expenses).where(eq(expenses.id, id)).limit(1));
    return row ?? null;
  }

  export async function create(input: ExpenseInsertType, tx?: DBTransaction): Promise<ExpenseSelectType> {
    const executor = tx ?? db;
    const [row] = await executor.insert(expenses).values(input).returning();
    if (!row) {
      throw new Error("expense insert returned no rows");
    }
    return row;
  }

  /**
   * Partial update; bumps `updatedAt`. Returns the updated row, or null when
   * no expense exists for the id.
   */
  export async function update(
    id: string,
    patch: ExpenseUpdatePatch,
    tx?: DBTransaction
  ): Promise<ExpenseSelectType | null> {
    const executor = tx ?? db;
    const [row] = await executor
      .update(expenses)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(expenses.id, id))
      .returning();
    return row ?? null;
  }

  /**
   * Soft-delete: sets `deletedAt`/`deletedByUserId`/`deletedReason` and bumps
   * `updatedAt`. Returns the updated row, or null when the id does not exist.
   */
  export async function softDelete(
    id: string,
    actorUserId: string,
    reason: string | null,
    tx?: DBTransaction
  ): Promise<ExpenseSelectType | null> {
    const executor = tx ?? db;
    const [row] = await executor
      .update(expenses)
      .set({ deletedAt: new Date(), deletedByUserId: actorUserId, deletedReason: reason, updatedAt: new Date() })
      .where(eq(expenses.id, id))
      .returning();
    return row ?? null;
  }

  /**
   * Soft-deletes a batch of expenses in one statement. Returns the soft-deleted
   * rows; rows whose ids do not exist are silently skipped.
   */
  export async function bulkSoftDelete(
    ids: readonly string[],
    actorUserId: string,
    reason: string | null,
    tx?: DBTransaction
  ): Promise<ExpenseSelectType[]> {
    if (ids.length === 0) return [];
    const executor = tx ?? db;
    return executor
      .update(expenses)
      .set({ deletedAt: new Date(), deletedByUserId: actorUserId, deletedReason: reason, updatedAt: new Date() })
      .where(inArray(expenses.id, [...ids]))
      .returning();
  }
}
