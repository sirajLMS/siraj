import { CalculationStatus } from "@/backend/enum";
import { ClassExecutionState } from "@/shared/constants/class-instance-detail.enum";
import { CurrencyCode } from "@/shared/constants/currency.enum";

export const MINUTES_PER_HOUR = 60n;
export const PERCENT_SCALE = 100n;
export const MINOR_UNITS_PER_UNIT = 100n;
export const MILLISECONDS_PER_MINUTE = 60_000;

/**
 * `class_status_events.eventType` is a plain varchar column with no TypeScript
 * enum counterpart — the two payroll event kinds are module constants.
 */
export const PAYROLL_STATUS_TRANSITION_EVENT_TYPE = "PAYROLL_STATUS_TRANSITION";
export const PAYROLL_OVERRIDE_EVENT_TYPE = "PAYROLL_OVERRIDE";

/** Duplicate submissions inside this window collapse onto the first persisted event. */
export const IDEMPOTENCY_WINDOW_SECONDS = 30;

/**
 * Refund rows must carry exactly this literal: the database CHECK constraint
 * compares text equality, so any other zero representation is rejected.
 */
export const REFUND_PAID_AMOUNT = "0";

/** Report aggregates scan the filtered set, bounded to the same ceiling as CSV export. */
export const REPORT_AGGREGATE_ROW_CAP = 10_000;

export const MIN_PARTIAL_PERCENTAGE = 0;
export const MAX_PARTIAL_PERCENTAGE = 100;

/** Statuses an operator may pick in the override dialog; settlement states are system-owned. */
export const OPERATOR_SELECTABLE_STATUSES = new Set<CalculationStatus>([
  CalculationStatus.REFUND,
  CalculationStatus.NOT_CALCULATED,
  CalculationStatus.CALCULATED,
  CalculationStatus.PARTIALLY,
]);

/**
 * Operator-controlled settlement statuses. Automatic recalculation never
 * overwrites them — an explicit forceRecalc is required.
 */
export const STICKY_STATUSES = new Set<CalculationStatus>([
  CalculationStatus.PARTIALLY,
  CalculationStatus.REFUND,
  CalculationStatus.WAITING_PAID,
]);

/** Execution states for which a payroll snapshot is meaningful. */
export const TERMINAL_EXECUTION_STATES = new Set<ClassExecutionState>([
  ClassExecutionState.COMPLETED,
  ClassExecutionState.ON_DEMAND_NO_CREDITS_CANCELLED,
  ClassExecutionState.ON_DEMAND_NO_CREDITS_ABSENT,
  ClassExecutionState.ON_DEMAND_CONFLICT_HELD,
  ClassExecutionState.ON_DEMAND_PENDING_CREDITS,
]);

export const AUTO_CALC_FAILURE_PREFIX = "Auto-calc failed:";
export const ZERO_PAID_AMOUNT = "0.00";
export const DEFAULT_REPORT_CURRENCY = CurrencyCode.SAR;
