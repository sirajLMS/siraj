import type { carryoverBalanceItems, carryoverBalances } from "@/backend/db/schema";
import type { CalculationStatus } from "@/backend/enum";
import type { CarryoverPaidStatus } from "@/shared/constants/billing/carryover.enum";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

/**
 * Carryover balance canonical types.
 *
 * A carryover balance aggregates already-audited class instances for one
 * teacher into a single payable record; paying the operator converts it into
 * an expense row (linked via `expenseId`). Monetary and duration values are
 * precision-safe decimal strings (text columns in the database).
 */

/** Drizzle row shape for `carryover_balances`. */
export type CarryoverBalanceSelectType = typeof carryoverBalances.$inferSelect;
/** Insert payload for `carryover_balances`. */
export type CarryoverBalanceInsertType = typeof carryoverBalances.$inferInsert;

/** Drizzle row shape for `carryover_balance_items`. */
export type CarryoverBalanceItemSelectType = typeof carryoverBalanceItems.$inferSelect;
/** Insert payload for `carryover_balance_items`. */
export type CarryoverBalanceItemInsertType = typeof carryoverBalanceItems.$inferInsert;

/**
 * One snapshot per aggregated session; the carryover id is attached at insert
 * time once the parent row exists.
 */
export type CarryoverItemDraft = Omit<CarryoverBalanceItemInsertType, "carryoverId" | "id" | "createdAt">;

/** Teacher display name + avatar resolved via teachers → users for carryover rows and drill-down views. */
export interface TeacherDisplayFields {
  teacherName: string;
  teacherAvatarUrl: string | null;
}

/**
 * One payroll status transition applied to a linked session during carryover
 * create, settle, unpay, or delete flows.
 */
export interface SessionStatusTransition {
  instanceId: string;
  fromStatus: CalculationStatus;
  toStatus: CalculationStatus;
  teacherPaidAmount: string | null;
  /**
   * `class_instances_partial_percentage_chk` ties the live partial-pay
   * percentage to the PARTIALLY status, so every transition drives the column
   * explicitly: null when the target is not PARTIALLY, the snapshot value when
   * reverting back to it.
   */
  isPartialPercentage: number | null;
}

/**
 * Minimal session shape consumed by the carryover aggregation helpers.
 * Structural — Drizzle `ClassInstanceSelectType` rows satisfy it without
 * mapping, and the fields are optional so partially-selected instances
 * (e.g. from narrowed selects) still type-check.
 */
export interface CarryoverAggregateInstance {
  teacherId: string;
  teacherPaidCurrency?: CurrencyCode | null;
  calculatedDuration?: number | null;
  scheduledStartAt?: Date | string | null;
}

/** Input for the bulk carryover-creation service (audited instances grouped by teacher). */
export interface BulkCreateCarryoverInput {
  instanceIds: readonly string[];
  actorUserId: string;
  clientRequestId?: string | null;
  note?: string | null;
}

/** Per-teacher outcome of a bulk carryover creation. */
export interface BulkCreateCarryoverGroupResult {
  teacherId: string;
  carryoverId: string;
  studentsCount: number;
  /** Total billable hours across the group, as a decimal string (2 decimals). */
  totalDuration: string;
  /** Aggregate amount owed to the teacher, as a decimal string. */
  payable: string;
  currency: CurrencyCode;
  instanceIds: string[];
}

export interface BulkCreateCarryoverResult {
  groups: BulkCreateCarryoverGroupResult[];
  totalInstanceIds: string[];
  auditLogIds: string[];
}

/** Internal outcome of one per-teacher group creation, including the audit row id. */
export interface GroupCreationOutcome {
  group: BulkCreateCarryoverGroupResult;
  auditLogId: string | null;
}

/** Aggregate values and item snapshots prepared for one teacher group's carryover insert. */
export interface PreparedGroupCarryover {
  carryover: CarryoverBalanceSelectType;
  drafts: CarryoverItemDraft[];
  dominantCurrency: CurrencyCode;
  studentsCount: number;
  totalDuration: string;
  payable: string;
}

/** Input for the bulk carryover-to-expense conversion. */
export interface BulkToExpenseInput {
  carryoverIds: readonly string[];
  /** ISO date when the payout happened. */
  paymentDate: string;
  /** Expense month (YYYY-MM); defaults to the paymentDate's month. */
  expenseDate?: string | null;
  note?: string | null;
  actorUserId: string;
  clientRequestId?: string | null;
}

/** Per-carryover outcome of a bulk carryover-to-expense conversion. */
export interface BulkToExpenseItemResult {
  carryoverId: string;
  expenseId: string;
  amount: string;
  currency: CurrencyCode;
}

export interface BulkToExpenseResult {
  items: BulkToExpenseItemResult[];
  auditLogIds: string[];
}

/** Shared settlement parameters for the bulk carryover-to-expense conversion. */
export interface SettlementContext {
  paymentDate: string;
  expenseDate: string;
  note: string | null;
  actorUserId: string;
  idempotencyKey: string;
}

/** Internal outcome of one per-carryover settlement, including the audit row id. */
export interface SettlementOutcome {
  item: BulkToExpenseItemResult;
  auditLogId: string | null;
}

export interface CreateCarryoverInput {
  teacherId: string;
  fromDate?: string | null;
  toDate?: string | null;
  payable: string;
  teacherCurrency: CurrencyCode;
  studentsCount?: number | null;
  studentsText?: string | null;
  note?: string | null;
  actorUserId: string;
  clientRequestId?: string | null;
}

export interface UpdateCarryoverInput {
  id: string;
  fromDate?: string | null;
  toDate?: string | null;
  payable?: string | null;
  teacherCurrency?: CurrencyCode | null;
  studentsCount?: number | null;
  studentsText?: string | null;
  note?: string | null;
  actorUserId: string;
}

/** Input for reverting a paid carryover (soft-delete expense, sessions back to awaiting settlement). */
export interface UnpayCarryoverInput {
  id: string;
  note?: string | null;
  actorUserId: string;
}

/** Input for deleting a single (unpaid) carryover. */
export interface DeleteCarryoverInput {
  id: string;
  actorUserId: string;
}

/** Outcome of deleting a single carryover. */
export interface DeleteCarryoverResult {
  id: string;
  deleted: boolean;
}

/** Input for the batch carryover deletion. */
export interface BulkDeleteCarryoverInput {
  ids: readonly string[];
  actorUserId: string;
}

export interface BulkDeleteCarryoverResult {
  deletedIds: string[];
  auditLogIds: string[];
}

/** Paid-state filter accepted by the carryover list query. */
export type CarryoverPaidStatusFilter = CarryoverPaidStatus;

export interface CarryoverFilters {
  teacherId?: string | null;
  paidStatus?: CarryoverPaidStatusFilter | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  includeDisabledTeachers?: boolean | null;
  search?: string | null;
}

/**
 * Carryover row joined with the teacher's display fields (resolved via
 * teachers → users). Timestamps stay as `Date` here; the service layer
 * serializes them for API consumers.
 */
type CarryoverBalanceListRow = CarryoverBalanceSelectType & {
  teacherName: string;
  teacherAvatarUrl: string | null;
};

export interface CarryoverBalancePageResult {
  rows: CarryoverBalanceListRow[];
  totalCount: number;
}

/** Patch columns for a carryover update; `id` is never patchable. */
export type CarryoverBalanceUpdatePatch = Partial<Omit<CarryoverBalanceInsertType, "id">>;

/** Read mode for the linked-session lookup used by the settlement flows. */
export interface FindLinkedSessionsOptions {
  /**
   * Locks every linked session row with `SELECT ... FOR UPDATE`. Requires a
   * transaction: the lock only exists for the duration of the caller's
   * transaction, so the caller's session transitions cannot race a concurrent
   * payroll recalculation.
   */
  forUpdate?: boolean;
}

/**
 * One carryover row as returned by the list query: the persisted carryover
 * columns with the teacher display fields resolved by join; timestamps are
 * serialized as ISO strings.
 */
export interface CarryoverRow {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherAvatarUrl: string | null;
  studentsCount: number | null;
  studentsText: string | null;
  totalDuration: string | null;
  payable: string;
  teacherCurrency: CurrencyCode;
  paid: string;
  fromDate: string | null;
  toDate: string | null;
  paymentDate: string | null;
  isDisabledTeacher: boolean;
  isPaid: boolean;
  expenseId: string | null;
  note: string | null;
  createdAt: string;
  paidAt: string | null;
}

/** Paid/unpaid row counts over the filtered carryover set (JSON scalar payload). */
export interface CarryoverPaidRowCounts {
  paid: number;
  unpaid: number;
}

export interface CarryoverPage {
  rows: CarryoverRow[];
  totalCount: number;
  aggregates: {
    totalPayable: string;
    totalPaid: string;
    dominantCurrency: CurrencyCode;
    rowCountByPaid: CarryoverPaidRowCounts;
  };
}

/**
 * One session linked to a carryover as read by the repository: the class
 * instance with its student and subject display fields resolved by join, the
 * original amount/status snapshot stored on `carryover_balance_items`, and the
 * session's current calculation status. The timestamp stays a `Date` here; the
 * service layer serializes it for API consumers.
 */
export interface CarryoverLinkedSessionRow {
  id: string;
  studentId: string;
  studentName: string;
  subjectName: string;
  scheduledStartAt: Date;
  durationMinutes: number;
  /** Decimal string amount owed to the teacher for this session, as captured at link time. */
  originalAmount: string;
  originalCurrency: CurrencyCode;
  /**
   * Calculation status snapshot taken when the session was linked. Kept as a
   * plain string because the snapshot can predate enum changes.
   */
  originalStatus: string;
  currentStatus: CalculationStatus;
}

/** One linked session as returned to API consumers; the timestamp is serialized as an ISO string. */
export interface CarryoverLinkedSession extends Omit<CarryoverLinkedSessionRow, "scheduledStartAt"> {
  scheduledStartAt: string;
}
