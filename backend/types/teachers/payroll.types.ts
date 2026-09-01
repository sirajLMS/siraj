import type { CalculationStatus } from "@/backend/enum";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

/** Input for computing the payroll snapshot of a single class instance. */
export interface PayrollCalculationInput {
  instanceId: string;
  actorUserId: string;
  /**
   * Provenance marker: an ON_DEMAND_* terminal state triggered this
   * calculation. Carries no branch weight — the payable-duration rules key
   * on the row outcome plus attendance telemetry, so an absent session pays
   * zero without join telemetry and pays the full window with it, whether
   * the terminal state was on-demand or not.
   */
  isOnDemand?: boolean;
  /** When true, recalculation is allowed even if the current status is PARTIALLY, REFUND, or WAITING_PAID. */
  forceRecalc?: boolean;
}

/** Payroll calculation outcome for a single class instance. */
export interface PayrollCalculationResult {
  instanceId: string;
  /** Payable duration in minutes. */
  calculatedDuration: number;
  /** Paid amount as a precision-safe decimal string. */
  teacherPaidAmount: string;
  teacherPaidCurrency: CurrencyCode;
  calculationStatus: CalculationStatus;
  /** True when the absence rule fired as student-absent. */
  isStudentAbsence: boolean;
  /** True when the absence rule fired as teacher-absent. */
  isTeacherAbsence: boolean;
  /** True when entry stayed within the grace window (on time). */
  isWithinGrace: boolean;
  /** True when the payable time was pro-rated (late entry beyond grace). */
  isProRated: boolean;
}

/** Operator input for manually overriding a class instance payroll status. */
export interface PayrollOverrideInput {
  instanceId: string;
  actorUserId: string;
  targetStatus: CalculationStatus;
  /** Required when targetStatus is PARTIALLY. Integer in the 0-100 range. */
  partialPercentage?: number | null;
  /** Operator note. Required for PARTIALLY and REFUND; optional otherwise. */
  note?: string | null;
  /** Bypasses the WAITING_PAID guard. Requires the ACCOUNTING_PAYROLL_MANAGE permission. */
  force?: boolean;
  /**
   * Client idempotency token. When provided (non-blank), the idempotency
   * key becomes instanceId + clientRequestId: every re-submission with the
   * same token inside the window collapses onto the first-applied result
   * even if other fields were edited in between, while a different token
   * starts a fresh override. Absent or blank falls back to the
   * content-derived key.
   */
  clientRequestId?: string | null;
}

/** Persisted payroll snapshot after an override has been applied. */
export interface PayrollOverrideResult {
  instanceId: string;
  calculationStatus: CalculationStatus;
  teacherPaidAmount: string | null;
  teacherPaidCurrency: CurrencyCode | null;
  calculatedDuration: number | null;
  isPartialPercentage: number | null;
  payrollNote: string | null;
  /** Id of the class_status_events audit row emitted for this override. */
  auditEventId: string;
}

/** Filters narrowing the payroll report query. */
export interface PayrollReportFilters {
  teacherId?: string | null;
  studentId?: string | null;
  /** Inclusive ISO date (YYYY-MM-DD) range start. */
  dateFrom?: string | null;
  /** Inclusive ISO date (YYYY-MM-DD) range end. */
  dateTo?: string | null;
  calculationStatuses?: readonly CalculationStatus[] | null;
  /** Free-text match against teacher and student names. */
  search?: string | null;
}

/** Flattened report row for one class instance, joined with teacher, student, and subject names. */
export interface PayrollReportRow {
  instanceId: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  scheduledDurationMinutes: number;
  actualStartAt: string | null;
  actualEndAt: string | null;
  calculatedDuration: number | null;
  teacherPaidAmount: string | null;
  teacherPaidCurrency: CurrencyCode | null;
  calculationStatus: CalculationStatus;
  isPartialPercentage: number | null;
  payrollNote: string | null;
  teacherId: string;
  teacherName: string;
  studentId: string;
  studentName: string;
  subjectId: string;
  subjectName: string;
  /** Derived: the absence rule fired as student-absent. */
  isStudentAbsence: boolean;
  /** Derived: the absence rule fired as teacher-absent. */
  isTeacherAbsence: boolean;
}

/** One page of the payroll report plus page-wide aggregates. */
export interface PayrollReportPage {
  rows: PayrollReportRow[];
  totalCount: number;
  aggregates: {
    /** Sum of paid amounts across the filtered set, as a precision-safe decimal string. */
    totalPaidAmount: string;
    totalPaidCurrency: CurrencyCode;
    /** Row counts keyed by calculation status; every status is present. */
    rowCountByStatus: Record<CalculationStatus, number>;
  };
}
