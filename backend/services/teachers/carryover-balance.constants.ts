import { CalculationStatus } from "@/backend/enum";
import type { AuditAction } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";

/** `class_status_events.eventType` is a plain varchar column — payroll event kinds are module constants. */
export const PAYROLL_STATUS_TRANSITION_EVENT_TYPE = "PAYROLL_STATUS_TRANSITION";

/** Duplicate submissions inside this window collapse onto the first-applied result. */
export const IDEMPOTENCY_WINDOW_SECONDS = 60;

/** Replay lookups page through the audit window in chunks of this size. */
export const REPLAY_LOOKUP_PAGE_SIZE = 500;

/** Defensive bound on replay-scan pages; the window holds far fewer rows in practice. */
export const REPLAY_LOOKUP_MAX_PAGES = 50;

/** Aggregates scan the filtered set, bounded to the same ceiling as the CSV export. */
export const REPORT_AGGREGATE_ROW_CAP = 10_000;

/** Persisted representation of an unsettled amount. */
export const ZERO_AMOUNT = "0";

/** `carryover_balances.students_text` column limit. */
export const STUDENTS_TEXT_MAX_LENGTH = 500;

export const CARRYOVER_AUDIT_ENTITY_TYPE = "CARRYOVER_BALANCE";

/** Fallback aggregation currency when the teacher has no rate currency configured. */
export const DEFAULT_AGGREGATE_CURRENCY = CurrencyCode.SAR;

export const MINOR_UNITS_BASE = 100n;
export const FX_RATE_SCALE = 1_000_000n;
export const FX_RATE_HALF_SCALE = FX_RATE_SCALE / 2n;

// Domains expand this union as new audit actions are introduced — the carryover
// mutations emit the four settlement actions below.
export const CARRYOVER_ACTION_CREATE: AuditAction = "CARRYOVER_CREATE";
export const CARRYOVER_ACTION_TO_EXPENSE: AuditAction = "CARRYOVER_TO_EXPENSE";
export const CARRYOVER_ACTION_DELETE: AuditAction = "CARRYOVER_DELETE";
export const CARRYOVER_ACTION_UNPAID: AuditAction = "CARRYOVER_UNPAID";

/** Canonical hyphenated uuid shape; anything else cannot name a row in the uuid-typed id columns. */
export const UUID_CANONICAL_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Audited payroll states eligible for carryover aggregation. */
export const AUDITED_STATUSES: ReadonlySet<CalculationStatus> = new Set([
  CalculationStatus.CALCULATED,
  CalculationStatus.PARTIALLY,
  CalculationStatus.REFUND,
]);

export const CURRENCY_BY_VALUE: ReadonlyMap<string, CurrencyCode> = new Map(
  Object.values(CurrencyCode).map(currency => [currency, currency])
);

export const CALCULATION_STATUS_BY_VALUE: ReadonlyMap<string, CalculationStatus> = new Map(
  Object.values(CalculationStatus).map(status => [status, status])
);
