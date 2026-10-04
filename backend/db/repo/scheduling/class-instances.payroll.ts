import { and, eq, inArray, isNull, type SQL } from "drizzle-orm";
import { queryDb, withForUpdate } from "@/backend/db";
import { classInstances } from "@/backend/db/schema";
import type { CalculationStatus } from "@/backend/enum";
import type * as Types from "@/backend/types";

/**
 * Payroll snapshot columns that may be written by a calculation or an
 * operator override. Deliberately narrow: payroll writes can never touch
 * scheduling, state-machine, or rate-snapshot columns through this method.
 */
export type PayrollCalculationPatch = Partial<
  Pick<
    Types.ClassInstanceSelectType,
    | "calculationStatus"
    | "calculatedDuration"
    | "teacherPaidAmount"
    | "teacherPaidCurrency"
    | "isPartialPercentage"
    | "payrollNote"
    | "payrollCalculatedAt"
    | "payrollCalculatedBy"
  >
>;

/** Read options for single-instance lookups. */
export interface GetClassInstanceOptions {
  /**
   * Locks the row with `SELECT ... FOR UPDATE`. Requires `tx` (the call
   * throws otherwise): the lock is held until that transaction commits or
   * rolls back, so a payroll write in the same transaction cannot race with
   * a concurrent calculator or override.
   */
  forUpdate?: boolean;
}

/**
 * Fetches a single class instance row by ID without hydration joins.
 * Unlike `getClassInstanceById` this returns the bare row, which keeps the
 * read cheap enough to sit on the payroll write path.
 */
export async function getById(
  id: string,
  tx?: Types.DBTransaction,
  opts?: GetClassInstanceOptions
): Promise<Types.ClassInstanceSelectType | null> {
  // Fail fast over a silent no-op: without a transaction the FOR UPDATE lock
  // is released the moment the statement finishes, so the caller would think
  // the row is locked while nothing is.
  if (opts?.forUpdate && tx == null) {
    throw new Error(
      "getById with forUpdate requires a transaction: the row lock only exists inside the caller transaction"
    );
  }
  const q = queryDb(tx);
  const base = q.select().from(classInstances).where(eq(classInstances.id, id));
  const [row] = await (opts?.forUpdate ? withForUpdate(base) : base).limit(1);
  return row ?? null;
}

/** Optional guards for payroll snapshot updates. */
export interface UpdatePayrollCalculationOptions {
  /**
   * Only fire the update while the row still carries this calculation
   * status. A caller that read the row without holding its lock uses the
   * precondition so a concurrent writer's committed transition (for
   * example a forced override) is never stomped: the update then matches
   * zero rows and this helper returns `null`, telling the caller to skip
   * the follow-up write instead of overwriting the newer state.
   */
  expectedStatus?: CalculationStatus;
}

/**
 * Applies a partial payroll-snapshot update to one class instance and returns
 * the updated row. `null` means the update matched no row: either the
 * instance does not exist, or — when `expectedStatus` is supplied — the
 * row's calculation status no longer matches, i.e. a concurrent writer
 * already transitioned it. Callers that locked the row first with
 * `getById(id, tx, { forUpdate: true })` may omit the precondition; callers
 * reading without the lock should always pass one.
 */
export async function updatePayrollCalculation(
  tx: Types.DBTransaction,
  id: string,
  patch: PayrollCalculationPatch,
  options?: UpdatePayrollCalculationOptions
): Promise<Types.ClassInstanceSelectType | null> {
  const conditions: SQL[] = [eq(classInstances.id, id)];
  if (options?.expectedStatus != null) {
    conditions.push(eq(classInstances.calculationStatus, options.expectedStatus));
  }
  const [updated] = await tx
    .update(classInstances)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(...conditions))
    .returning();
  return updated ?? null;
}

/**
 * Locks and fetches multiple class instance rows in a single
 * `SELECT ... FOR UPDATE`. The rows stay locked until the caller's
 * transaction commits or rolls back, which is what lets carryover
 * aggregation validate-and-link atomically without a concurrent writer
 * re-linking or re-calculating a session mid-transaction. Rows are read in
 * ascending id order (ids are sorted before the IN clause and the statement
 * orders by id) so concurrent callers lock overlapping id sets in the same
 * order, and soft-deleted rows are excluded like every other read path in
 * this repository — a deleted session can never be aggregated into a
 * carryover. Missing ids surface via the caller's count check.
 *
 * `tx` is required — the lock only exists inside an open transaction, so a
 * bare read would feign mutual exclusion it never had. Ids without a
 * matching row are silently absent from the result; callers compare counts
 * to detect missing instances.
 */
export async function getByIdsForUpdate(
  ids: readonly string[],
  tx: Types.DBTransaction
): Promise<Types.ClassInstanceSelectType[]> {
  if (ids.length === 0) return [];
  const sortedIds = [...ids].toSorted((a, b) => a.localeCompare(b));
  const base = tx
    .select()
    .from(classInstances)
    .where(and(inArray(classInstances.id, sortedIds), isNull(classInstances.deletedAt)))
    .orderBy(classInstances.id);
  return withForUpdate(base);
}

/**
 * Returns every class instance currently linked to the given carryover
 * balance. Used by payout and unpay flows that must transition all linked
 * sessions together.
 */
export async function findByCarryoverId(
  carryoverId: string,
  tx?: Types.DBTransaction
): Promise<Types.ClassInstanceSelectType[]> {
  const q = queryDb(tx);
  return q.select().from(classInstances).where(eq(classInstances.carryoverBalanceId, carryoverId));
}

/**
 * Points a batch of class instances at a carryover balance and returns the
 * updated rows. Data access only: validating that the sessions are audited
 * and not already linked belongs to the calling service, together with the
 * `getByIdsForUpdate` row locks that make the validation meaningful.
 */
export async function linkToCarryover(
  instanceIds: readonly string[],
  carryoverId: string,
  tx: Types.DBTransaction
): Promise<Types.ClassInstanceSelectType[]> {
  if (instanceIds.length === 0) return [];
  return tx
    .update(classInstances)
    .set({ carryoverBalanceId: carryoverId, updatedAt: new Date() })
    .where(inArray(classInstances.id, [...instanceIds]))
    .returning();
}

/**
 * Detaches a batch of class instances from their carryover balance by
 * nulling the link column and returns the updated rows. Restoring each
 * session's prior calculation status is orchestrated by the calling
 * service from the carryover's item snapshots.
 */
export async function unlinkFromCarryover(
  instanceIds: readonly string[],
  tx: Types.DBTransaction
): Promise<Types.ClassInstanceSelectType[]> {
  if (instanceIds.length === 0) return [];
  return tx
    .update(classInstances)
    .set({ carryoverBalanceId: null, updatedAt: new Date() })
    .where(inArray(classInstances.id, [...instanceIds]))
    .returning();
}
