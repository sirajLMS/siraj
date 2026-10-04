import type {
  CalculationStatus,
  CarryoverBalanceLinkedSessionsQuery_carryoverBalanceLinkedSessions,
  CarryoverBalanceQuery_carryoverBalance,
  CurrencyCode,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { formatLockedAmount } from "@/frontend/common/lib/currency";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";

export type CarryoverDetail = CarryoverBalanceQuery_carryoverBalance;

export type LinkedSession = CarryoverBalanceLinkedSessionsQuery_carryoverBalanceLinkedSessions;

/** Localized label per payroll calculation status shown in the linked-session table. */
export type CarryoverStatusLabels = Record<CalculationStatus, string>;

const MINUTES_PER_HOUR = 60;

/** Cache of `Intl.NumberFormat` instances keyed by Latin locale tag to avoid CPU and GC overhead in session rows. */
const sessionHoursFormatCache = new Map<string, Intl.NumberFormat>();

function getSessionHoursNumberFormat(locale: string): Intl.NumberFormat {
  const tag = getLatnLocaleTag(locale);
  let formatter = sessionHoursFormatCache.get(tag);
  if (!formatter) {
    formatter = new Intl.NumberFormat(tag, { maximumFractionDigits: 2 });
    sessionHoursFormatCache.set(tag, formatter);
  }
  return formatter;
}

/** Session duration cell: minutes converted to locale-formatted hours, mirroring the billable-hours convention of the summary duration field. */
export function formatSessionHours(minutes: number | null, locale: string, notSet: string): string {
  if (minutes === null || !Number.isFinite(minutes)) {
    return notSet;
  }
  return getSessionHoursNumberFormat(locale).format(minutes / MINUTES_PER_HOUR);
}

/** Link-time snapshot amount paired with its snapshot currency; the pair is null-safe together. */
export function formatSessionAmount(
  amount: string | null,
  currency: CurrencyCode | null,
  locale: string,
  notSet: string
): string {
  if (amount === null || currency === null) {
    return notSet;
  }
  return formatLockedAmount(amount, currency, locale);
}

/** Separator set for the free-text student roster: Latin and Arabic comma/semicolon. */
const STUDENTS_TEXT_SEPARATOR = /[,;،؛]/;

/**
 * Stored count wins when present; manual rows sometimes carry only the
 * free-text roster (comma- or semicolon-separated, Latin or Arabic marks), so
 * the count is derived from it before falling back to the not-set label.
 */
export function resolveStudentsCount(value: number | null, studentsText: string | null, notSet: string): string {
  if (value !== null) {
    return String(value);
  }
  const text = studentsText?.trim() ?? "";
  if (text === "") {
    return notSet;
  }
  return String(text.split(STUDENTS_TEXT_SEPARATOR).filter(name => name.trim() !== "").length);
}
