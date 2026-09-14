import type { CalculationStatus } from "@/backend/enum";
import type { SessionAuditReportSortFieldEnum } from "@/backend/enum/billing/session-audit.enum";

import type { SessionAuditStatus } from "@/shared/constants/classes/session-audit-status";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

export type { SessionAuditStatus };

/**
 * Filters accepted by the session audit report query. Every field is
 * optional; a null or absent field leaves that dimension unfiltered.
 */
export interface SessionAuditReportFilters {
  teacherId?: string | null;
  studentId?: string | null;
  /** ISO date (YYYY-MM-DD) in the operator's timezone — inclusive lower bound on the scheduled start. */
  dateFrom?: string | null;
  /** ISO date (YYYY-MM-DD) in the operator's timezone — inclusive upper bound on the scheduled start. */
  dateTo?: string | null;
  /** Restrict to sessions whose derived audit status is one of these values. */
  currentStatuses?: readonly SessionAuditStatus[] | null;
  /** Free-text substring match against teacher and student names. */
  search?: string | null;
  /** Include soft-deleted class instances; defaults to false and is forcibly cleared for non-managed callers. */
  includeDeleted?: boolean | null;
}

/** Sortable columns of the session audit report, derived from the runtime enum. */
export type SessionAuditReportSortField =
  `${(typeof SessionAuditReportSortFieldEnum)[keyof typeof SessionAuditReportSortFieldEnum]}`;

export interface SessionAuditReportSort {
  field: SessionAuditReportSortField;
  direction: "asc" | "desc";
}

/**
 * One row of the session audit report: the class-instance scheduling and
 * attendance columns, the payroll snapshot columns (null until a payroll
 * calculation has run for the instance), and the denormalized teacher /
 * student / subject display names.
 */
export interface SessionAuditReportRow {
  instanceId: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  durationMinutes: number;
  /** Timestamp of the operator-controlled session open; null when the session was never opened. */
  actualStartAt: string | null;
  /** Timestamp of the operator-controlled session end; null when the session was never closed. */
  actualEndAt: string | null;
  /** Timezone the booking was made in, shown to operators for timestamp context. */
  bookingTimezone: string | null;
  currentStatus: SessionAuditStatus;
  /** Payroll-computed payable duration in minutes; null before calculation. */
  calculatedDuration: number | null;
  /** Payable amount as a precision-safe decimal string; null before calculation. */
  teacherPaidAmount: string | null;
  teacherPaidCurrency: CurrencyCode | null;
  calculationStatus: CalculationStatus | null;
  /** Partial-payment percentage (0–100); null unless the status is a partial payment. */
  isPartialPercentage: number | null;
  payrollNote: string | null;
  payrollCalculatedAt: string | null;
  /** Carryover balance this session has been rolled into; null while unlinked. */
  carryoverBalanceId: string | null;
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  subjectId: string;
  subjectName: string;
  /** Date the teacher was actually paid; null while the calculation is not yet paid. */
  teacherDuePaymentDate: string | null;
}

/**
 * Aggregate counters for the session audit report. Computed over the rows
 * of the current page only; `totalCount` on the page carries the full
 * un-paginated result size.
 */
export interface SessionAuditReportAggregates {
  rowCountByStatus: Record<SessionAuditStatus, number>;
  rowCountByPaid: { paid: number; unpaid: number };
  /** Sum of the page's payable amounts as a decimal string. */
  totalPaidAmount: string;
  /** Currency of the aggregated payable amount. */
  totalPaidCurrency: CurrencyCode;
}

export interface SessionAuditReportPage {
  rows: SessionAuditReportRow[];
  /** Total number of rows matching the filters, independent of pagination. */
  totalCount: number;
  aggregates: SessionAuditReportAggregates;
}
