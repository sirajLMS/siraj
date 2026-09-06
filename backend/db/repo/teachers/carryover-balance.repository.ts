import { and, desc, eq, gte, inArray, isNull, lte, or, type SQL, sql } from "drizzle-orm";
import { caseInsensitiveLike, db, queryDb, withForUpdate } from "@/backend/db";
import {
  carryoverBalanceItems,
  carryoverBalances,
  classInstances,
  classSubjects,
  students,
  teachers,
  users,
} from "@/backend/db/schema";
import type {
  CarryoverBalanceInsertType,
  CarryoverBalanceItemInsertType,
  CarryoverBalanceItemSelectType,
  CarryoverBalancePageResult,
  CarryoverBalanceSelectType,
  CarryoverBalanceUpdatePatch,
  CarryoverFilters,
  CarryoverLinkedSessionRow,
  ClassInstanceSelectType,
  DBTransaction,
  FindLinkedSessionsOptions,
} from "@/backend/types";
import { escapeLikeWildcards } from "@/backend/utils";

export namespace CarryoverBalanceRepository {
  function buildConditions(filters: CarryoverFilters): SQL[] {
    const conditions: SQL[] = [];
    if (filters.teacherId) {
      conditions.push(eq(carryoverBalances.teacherId, filters.teacherId));
    }
    if (filters.paidStatus === "Paid") {
      conditions.push(eq(carryoverBalances.isPaid, true));
    }
    if (filters.paidStatus === "Unpaid") {
      conditions.push(eq(carryoverBalances.isPaid, false));
    }
    // from/to dates are ISO calendar dates (YYYY-MM-DD) stored as text, so
    // lexicographic comparison matches chronological ordering.
    if (filters.dateFrom) {
      conditions.push(gte(carryoverBalances.fromDate, filters.dateFrom));
    }
    if (filters.dateTo) {
      conditions.push(lte(carryoverBalances.toDate, filters.dateTo));
    }
    if (!filters.includeDisabledTeachers) {
      conditions.push(eq(carryoverBalances.isDisabledTeacher, false));
    }
    const search = filters.search?.trim();
    if (search) {
      const pattern = `%${escapeLikeWildcards(search)}%`;
      const searchCondition = or(
        caseInsensitiveLike(users.name, pattern),
        caseInsensitiveLike(carryoverBalances.studentsText, pattern)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }
    return conditions;
  }

  async function countFiltered(conditions: SQL[], tx?: DBTransaction): Promise<number> {
    const q = queryDb(tx);
    const [row] = await q
      .select({ totalCount: sql<number>`count(*)`.mapWith(Number) })
      .from(carryoverBalances)
      .innerJoin(teachers, eq(carryoverBalances.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(and(...conditions));
    return row?.totalCount ?? 0;
  }

  /**
   * Paginated, filtered carryover list with the teacher's display fields
   * resolved by join. `totalCount` counts the full filtered set (before
   * limit/offset) so callers can render pagination controls. Read aggregates
   * (totals, dominant currency) are derived by the caller from the rows.
   */
  export async function findFiltered(
    filters: CarryoverFilters,
    pagination: { limit: number; offset: number },
    tx?: DBTransaction
  ): Promise<CarryoverBalancePageResult> {
    const conditions = buildConditions(filters);
    const q = queryDb(tx);

    const pageRows = await q
      .select({
        carryover: carryoverBalances,
        teacherName: users.name,
        teacherAvatarUrl: users.avatarUrl,
      })
      .from(carryoverBalances)
      .innerJoin(teachers, eq(carryoverBalances.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(and(...conditions))
      // Newest first; id tiebreak keeps pagination deterministic.
      .orderBy(desc(carryoverBalances.createdAt), carryoverBalances.id)
      .limit(pagination.limit)
      .offset(pagination.offset);

    const totalCount = await countFiltered(conditions, tx);

    return {
      rows: pageRows.map(row =>
        Object.assign(row.carryover, {
          teacherName: row.teacherName,
          teacherAvatarUrl: row.teacherAvatarUrl,
        })
      ),
      totalCount,
    };
  }

  /**
   * Locking batch lookup for settlement flows. Takes an exclusive row lock
   * (`FOR UPDATE` on PostgreSQL) on every found row, ordered by id so
   * concurrent bulk operations lock rows in the same order and avoid
   * deadlocks. Must be called inside a transaction: the lock only lives for
   * the duration of the caller's transaction, and the same executor must
   * carry the follow-up writes that the lock protects.
   */
  export async function getByIdsForUpdate(
    ids: readonly string[],
    tx: DBTransaction
  ): Promise<CarryoverBalanceSelectType[]> {
    if (ids.length === 0) return [];
    const sortedIds = [...ids].toSorted((a, b) => a.localeCompare(b));
    return withForUpdate(
      tx.select().from(carryoverBalances).where(inArray(carryoverBalances.id, sortedIds)).orderBy(carryoverBalances.id)
    );
  }

  export async function getById(id: string, tx?: DBTransaction): Promise<CarryoverBalanceSelectType | null> {
    const q = queryDb(tx);
    const [row] = await q.select().from(carryoverBalances).where(eq(carryoverBalances.id, id)).limit(1);
    return row ?? null;
  }

  export async function findByTeacherId(teacherId: string, tx?: DBTransaction): Promise<CarryoverBalanceSelectType[]> {
    const q = queryDb(tx);
    return q
      .select()
      .from(carryoverBalances)
      .where(eq(carryoverBalances.teacherId, teacherId))
      .orderBy(desc(carryoverBalances.createdAt), carryoverBalances.id);
  }

  /**
   * Class instances aggregated by a carryover, resolved through the snapshot
   * items (not the `carryover_balance_id` back-reference), so the result is
   * still available if sessions have been unlinked. Soft-deleted sessions are
   * excluded, matching every other class-instance read path: a settlement must
   * never pay out a deleted session.
   *
   * With `opts.forUpdate` the session rows are locked (`FOR UPDATE` on
   * PostgreSQL) until the caller's transaction ends, so the follow-up status
   * transitions cannot race a concurrent payroll recalculation. `tx` is then
   * required — a lock acquired outside a transaction releases the moment the
   * statement finishes.
   */
  export async function findLinkedSessions(
    carryoverId: string,
    tx?: DBTransaction,
    opts?: FindLinkedSessionsOptions
  ): Promise<ClassInstanceSelectType[]> {
    if (opts?.forUpdate && tx == null) {
      throw new Error(
        "findLinkedSessions with forUpdate requires a transaction: the row lock only exists inside the caller transaction"
      );
    }
    const q = queryDb(tx);
    const base = q
      .select({ instance: classInstances })
      .from(carryoverBalanceItems)
      .innerJoin(classInstances, eq(carryoverBalanceItems.classInstanceId, classInstances.id))
      .where(and(eq(carryoverBalanceItems.carryoverId, carryoverId), isNull(classInstances.deletedAt)))
      .orderBy(classInstances.scheduledStartAt, carryoverBalanceItems.id);
    const rows = await (opts?.forUpdate ? withForUpdate(base) : base);
    return rows.map(({ instance }) => instance);
  }

  /**
   * The sessions aggregated into one carryover with their display fields and
   * the item snapshots: student and subject names resolve by join, while the
   * original amount/status come from the `carryover_balance_items` snapshot
   * row so the list keeps rendering the link-time values, and the session's
   * current calculation status stays live.
   */
  export async function findLinkedSessionRows(
    carryoverId: string,
    tx?: DBTransaction
  ): Promise<CarryoverLinkedSessionRow[]> {
    const q = queryDb(tx);
    return q
      .select({
        id: classInstances.id,
        studentId: classInstances.studentId,
        studentName: students.name,
        subjectName: classSubjects.name,
        scheduledStartAt: classInstances.scheduledStartAt,
        durationMinutes: classInstances.durationMinutes,
        originalAmount: carryoverBalanceItems.originalAmount,
        originalCurrency: carryoverBalanceItems.originalCurrency,
        originalStatus: carryoverBalanceItems.originalStatus,
        currentStatus: classInstances.calculationStatus,
      })
      .from(carryoverBalanceItems)
      .innerJoin(classInstances, eq(carryoverBalanceItems.classInstanceId, classInstances.id))
      .innerJoin(students, eq(classInstances.studentId, students.id))
      .innerJoin(classSubjects, eq(classInstances.subjectId, classSubjects.id))
      .where(eq(carryoverBalanceItems.carryoverId, carryoverId))
      .orderBy(classInstances.scheduledStartAt, carryoverBalanceItems.id);
  }

  /**
   * Number of snapshot items per carryover, batched for DataLoader-backed
   * field resolution: every requested id maps to a count (0 when a carryover
   * has no items). Resolved via the item rows rather than the
   * `carryover_balance_id` back-reference so the count survives unlinking.
   */
  export async function countLinkedSessionsByCarryoverIds(
    carryoverIds: readonly string[],
    tx?: DBTransaction
  ): Promise<Map<string, number>> {
    const counts = new Map(carryoverIds.map(id => [id, 0]));
    if (carryoverIds.length === 0) return counts;
    const q = queryDb(tx);
    const rows = await q
      .select({
        carryoverId: carryoverBalanceItems.carryoverId,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(carryoverBalanceItems)
      .where(inArray(carryoverBalanceItems.carryoverId, [...carryoverIds]))
      .groupBy(carryoverBalanceItems.carryoverId);
    for (const row of rows) {
      counts.set(row.carryoverId, row.count);
    }
    return counts;
  }

  export async function create(
    input: CarryoverBalanceInsertType,
    tx?: DBTransaction
  ): Promise<CarryoverBalanceSelectType> {
    const executor = tx ?? db;
    const [row] = await executor.insert(carryoverBalances).values(input).returning();
    if (!row) {
      throw new Error("carryover balance insert returned no rows");
    }
    return row;
  }

  /**
   * Partial update; bumps `updatedAt`. Returns the updated row, or null when
   * no carryover exists for the id.
   */
  export async function update(
    id: string,
    patch: CarryoverBalanceUpdatePatch,
    tx?: DBTransaction
  ): Promise<CarryoverBalanceSelectType | null> {
    const executor = tx ?? db;
    const [row] = await executor
      .update(carryoverBalances)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(carryoverBalances.id, id))
      .returning();
    return row ?? null;
  }

  /**
   * Hard delete; snapshot items are removed by the database via ON DELETE
   * CASCADE. Returns the deleted row, or null when the id does not exist.
   */
  export async function deleteById(id: string, tx?: DBTransaction): Promise<CarryoverBalanceSelectType | null> {
    const executor = tx ?? db;
    const [row] = await executor.delete(carryoverBalances).where(eq(carryoverBalances.id, id)).returning();
    return row ?? null;
  }

  /**
   * Hard-deletes a batch of carryovers in one statement. Returns the deleted
   * rows; rows whose ids do not exist are silently skipped.
   */
  export async function bulkDelete(ids: readonly string[], tx?: DBTransaction): Promise<CarryoverBalanceSelectType[]> {
    if (ids.length === 0) return [];
    const executor = tx ?? db;
    return executor
      .delete(carryoverBalances)
      .where(inArray(carryoverBalances.id, [...ids]))
      .returning();
  }

  /**
   * Bulk-inserts snapshot items for a freshly created carryover (one row per
   * aggregated class instance).
   */
  export async function insertItems(
    items: CarryoverBalanceItemInsertType[],
    tx?: DBTransaction
  ): Promise<CarryoverBalanceItemSelectType[]> {
    if (items.length === 0) return [];
    const executor = tx ?? db;
    return executor.insert(carryoverBalanceItems).values(items).returning();
  }
}
