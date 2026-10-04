import { CalculationStatus } from "@/backend/enum";

/**
 * `class_status_events.eventType` is a plain varchar column with no TypeScript
 * enum counterpart — the payroll lifecycle transition kind is a module
 * constant (same convention as the payroll calculation service).
 */
export const PAYROLL_STATUS_TRANSITION_EVENT_TYPE = "PAYROLL_STATUS_TRANSITION";

/**
 * Payroll snapshot statuses whose stored `teacherPaidAmount` is the
 * authoritative amount owed to the teacher.
 */
export const AUTHORITATIVE_AMOUNT_STATUSES: ReadonlySet<CalculationStatus> = new Set([
  CalculationStatus.CALCULATED,
  CalculationStatus.PARTIALLY,
  CalculationStatus.REFUND,
]);

/**
 * Statuses that move to `WAITING_PAID` when a due accrues. Settled (`PAID`)
 * rows never regress, and rows already awaiting settlement keep their state,
 * so a repeat accrual (normally blocked by the one-due-per-instance unique
 * index) stays a no-op instead of duplicating the transition event.
 */
export const WAITING_PAID_ENTRY_STATUSES: ReadonlySet<CalculationStatus> = new Set([
  CalculationStatus.NOT_CALCULATED,
  CalculationStatus.CALCULATED,
  CalculationStatus.PARTIALLY,
  CalculationStatus.REFUND,
]);

export const MINUTES_PER_HOUR = 60;
