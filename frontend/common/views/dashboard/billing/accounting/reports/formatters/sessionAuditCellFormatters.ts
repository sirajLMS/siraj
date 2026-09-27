import { formatDateTime, parseDateInput } from "@/frontend/common/components/intl/dateFormat";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { formatLockedAmount } from "@/frontend/common/lib/currency";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";
import type { SessionAuditLabels } from "@/shared/locale/types/dashboard/reports";

/** Localized placeholder text for audit-report cells with no renderable value. */
export type SessionAuditCellLabels = SessionAuditLabels["cell"];

/** Accepted timestamp shapes: ISO strings from the API plus dates/epoch numbers. */
export type SessionAuditDateInput = Date | string | number | null | undefined;

/** Maximum characters shown inline before a note is truncated. */
export const SESSION_AUDIT_NOTE_PREVIEW_LENGTH = 200;

/**
 * Renders a timestamp cell in the operator's own locale and runtime time zone —
 * the booking zone is tooltip-only context, never the cell's rendering zone.
 * Unparseable non-empty strings are passed through verbatim (mirroring
 * `formatWithFallback` in the intl date helpers) so corrupted data stays
 * visible instead of masquerading as empty.
 */
function resolveDateTimeCell(value: SessionAuditDateInput, locale: string, fallbackText: string): string {
  const parsed = parseDateInput(value);
  if (!parsed) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
    return fallbackText;
  }
  return formatDateTime(parsed, locale);
}

/**
 * Room-entry cell: localized date-time in the operator's time zone, or the
 * "not joined" placeholder when the teacher never entered the room.
 */
export function formatOpenSessionTime(
  value: SessionAuditDateInput,
  locale: string,
  labels: SessionAuditCellLabels
): string {
  return resolveDateTimeCell(value, locale, labels.notJoined);
}

/**
 * Room-exit cell: localized date-time in the operator's time zone, or the
 * "in progress" placeholder while the session is still running.
 */
export function formatEndSessionTime(
  value: SessionAuditDateInput,
  locale: string,
  labels: SessionAuditCellLabels
): string {
  return resolveDateTimeCell(value, locale, labels.inProgress);
}

/**
 * Duration cell: whole minutes as a plain integer string, or the
 * "not calculated" em-dash placeholder for missing/non-finite input.
 */
export function formatDurationMinutes(minutes: number | null | undefined, labels: SessionAuditCellLabels): string {
  if (minutes == null || !Number.isFinite(minutes)) {
    return labels.notCalculated;
  }
  return String(Math.round(minutes));
}

/** Cache of percentage `Intl.NumberFormat` instances keyed by locale tag. */
const percentageNumberFormatCache = new Map<string, Intl.NumberFormat>();

function getPercentageNumberFormat(locale: string): Intl.NumberFormat {
  const key = getLatnLocaleTag(locale);
  let formatter = percentageNumberFormatCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(key, { maximumFractionDigits: 0 });
    percentageNumberFormatCache.set(key, formatter);
  }
  return formatter;
}

/**
 * Partial-completion cell for the payroll column: a localized whole percentage
 * with a trailing percent sign, or the "not calculated" em-dash placeholder for
 * missing/non-finite input.
 */
export function formatPartialPercentage(
  percentage: number | null | undefined,
  locale: string,
  labels: SessionAuditCellLabels
): string {
  if (percentage == null || !Number.isFinite(percentage)) {
    return labels.notCalculated;
  }
  const value = getPercentageNumberFormat(locale).format(percentage);
  return `${value}%`;
}

/**
 * Paid-amount cell: pairs the amount with its currency via the canonical
 * `formatLockedAmount` money formatter, or the "not calculated" em-dash
 * placeholder when either half of the amount/currency pair is missing.
 */
export function formatPaidAmount(
  amount: string | null | undefined,
  currency: CurrencyCode | null | undefined,
  locale: string,
  labels: SessionAuditCellLabels
): string {
  if (amount == null || !currency) {
    return labels.notCalculated;
  }
  const trimmed = amount.trim();
  if (trimmed.length === 0 || !Number.isFinite(Number.parseFloat(trimmed))) {
    return labels.notCalculated;
  }
  return formatLockedAmount(trimmed, currency, locale);
}

/** Display model for the note cell: inline preview plus the untruncated text. */
export interface SessionAuditNoteCell {
  readonly preview: string;
  readonly truncated: boolean;
  readonly fullText: string;
}

/**
 * Note cell: trims the note and, when it exceeds the preview budget, exposes
 * a truncated preview with an ellipsis. Returns `null` for empty notes so the
 * cell renders nothing at all rather than an empty popover affordance.
 */
export function formatNoteCell(note: string | null | undefined): SessionAuditNoteCell | null {
  const fullText = note?.trim() ?? "";
  if (fullText.length === 0) {
    return null;
  }
  if (fullText.length <= SESSION_AUDIT_NOTE_PREVIEW_LENGTH) {
    return { preview: fullText, truncated: false, fullText };
  }
  return {
    preview: `${fullText.slice(0, SESSION_AUDIT_NOTE_PREVIEW_LENGTH)}…`,
    truncated: true,
    fullText,
  };
}
