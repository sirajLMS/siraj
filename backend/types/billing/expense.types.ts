import type { expenses } from "@/backend/db/schema";
import type { ExpenseType } from "@/backend/enum";
import type { DBTransaction } from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

/**
 * Expense ledger canonical types.
 *
 * An expense is one outgoing monetary row: manually entered operational spend
 * (`sourceEntity = null`) or an auto-generated salary payout written by the
 * carryover settlement flow (`sourceEntity = 'carryover_balances'`).
 * Monetary amounts are precision-safe decimal strings (text columns), and
 * rows are soft-deleted — never hard-deleted — for auditability.
 */

/** Drizzle row shape for `expenses`. */
export type ExpenseSelectType = typeof expenses.$inferSelect;
/** Insert payload for `expenses`. */
export type ExpenseInsertType = typeof expenses.$inferInsert;
/**
 * Patch columns for an expense update. The immutable identity, audit-creation,
 * and provenance columns are excluded: they are written once at insert and can
 * never be patched.
 */
export type ExpenseUpdatePatch = Partial<
  Omit<ExpenseInsertType, "id" | "createdAt" | "createdByUserId" | "sourceEntity" | "sourceEntityId">
>;

/** Input for the manual (UI) expense creation entry point. */
export interface CreateExpenseInput {
  teacherId?: string | null;
  teacherName?: string | null;
  title: string;
  type: ExpenseType;
  /** Amount as a decimal string (no float drift). */
  expenseValue: string;
  expenseCurrency: CurrencyCode;
  /** ISO calendar date (YYYY-MM-DD) of the real-world payout. */
  paymentDate: string;
  /** Accounting month (YYYY-MM). */
  expenseDate: string;
  note?: string | null;
  /** Provenance — null for manual UI entries; set by settlement flows. */
  sourceEntity?: string | null;
  sourceEntityId?: string | null;
  createdByUserId: string;
  /** Client idempotency key for double-submit absorption. */
  clientRequestId?: string | null;
}

export interface UpdateExpenseInput {
  id: string;
  title?: string | null;
  type?: ExpenseType | null;
  expenseValue?: string | null;
  expenseCurrency?: CurrencyCode | null;
  paymentDate?: string | null;
  expenseDate?: string | null;
  note?: string | null;
  teacherId?: string | null;
  teacherName?: string | null;
  actorUserId: string;
}

export interface BulkDeleteExpensesInput {
  ids: readonly string[];
  reason?: string | null;
  actorUserId: string;
}

/** Result of a single expense soft-delete (UI delete entry point). */
export interface DeleteExpenseResult {
  id: string;
  deleted: boolean;
}

/** Result of an atomic bulk soft-delete: the ids applied plus the audit rows emitted. */
export interface BulkDeleteExpensesResult {
  deleted: string[];
  auditLogIds: string[];
}

/** Input for the shared soft-delete entry point (UI delete and settlement unpay). */
export interface SoftDeleteExpenseInput {
  id: string;
  actorUserId: string;
  reason?: string | null;
  /** Caller-owned transaction (settlement flows pass theirs for atomicity). */
  tx?: DBTransaction;
}

/** Page-level filter set accepted by the expense ledger list query. */
export interface ExpenseFilters {
  title?: string | null;
  types?: readonly ExpenseType[] | null;
  /** Accounting month (YYYY-MM). */
  expenseDate?: string | null;
  paymentDateFrom?: string | null;
  paymentDateTo?: string | null;
  includeDeleted?: boolean | null;
}

/**
 * Page-level result of the expense ledger list query as returned by the
 * repository: the persisted rows plus the creator's display name resolved by
 * join, with timestamps still as `Date`. The service layer serializes each
 * row into the canonical `ExpenseRow` (ISO strings) for API consumers.
 */
export interface ExpensePageResult {
  rows: (ExpenseSelectType & { createdByName: string })[];
  totalCount: number;
}

/**
 * The canonical expense row returned to API consumers, derived from the
 * persisted columns: timestamps are serialized as ISO strings and the
 * creator's display name is resolved by join.
 */
export type ExpenseRow = Omit<ExpenseSelectType, "createdAt" | "updatedAt" | "deletedAt"> & {
  createdByName: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export interface ExpensePage {
  rows: ExpenseRow[];
  totalCount: number;
  aggregates: {
    totalValue: string;
    dominantCurrency: CurrencyCode;
    rowCountByType: Record<ExpenseType, number>;
  };
}
