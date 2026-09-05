import { SessionAuditRepository } from "@/backend/db/repo/scheduling";
import { AppPermission, CalculationStatus } from "@/backend/enum";
import { logger, ValidationError } from "@/backend/lib";
import { requirePermission } from "@/backend/services/billing/permission-utils";
import type {
  SessionAuditReportAggregates,
  SessionAuditReportFilters,
  SessionAuditReportPage,
  SessionAuditReportRow,
  SessionAuditReportSort,
  SessionAuditStatus,
} from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ErrorsLabels } from "@/shared/locale";

const DEFAULT_REPORT_SORT: SessionAuditReportSort = { field: "scheduledStartAt", direction: "desc" };

/**
 * Date window applied when the caller supplies neither bound: the 30 calendar
 * days ending on the current UTC date (UTC matches the day boundaries the
 * repository filters on). A bound the caller did provide is never overridden.
 */
const DEFAULT_DATE_RANGE_DAYS = 30;
const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

/** Fallback currency for the page total when no row carries a paid currency. */
const DEFAULT_TOTAL_CURRENCY = CurrencyCode.SAR;

/**
 * Parses a canonical decimal amount (e.g. `"120.00"`) into an integer count
 * of hundredths so page totals never round-trip through floats. Amounts with
 * extra fraction digits are rounded half-up; malformed values return null so
 * they are excluded from the total instead of silently counted as zero.
 */
function toMinorHundredths(raw: string): bigint | null {
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(raw.trim());
  const integerDigits = match?.[2];
  if (match == null || integerDigits == null) return null;
  const fractionDigits = (match[3] ?? "").padEnd(2, "0");
  let hundredths = BigInt(integerDigits) * 100n + BigInt(fractionDigits.slice(0, 2) || "0");
  const roundingDigit = fractionDigits[2];
  if (roundingDigit != null && roundingDigit >= "5") hundredths += 1n;
  return match[1] === "-" ? -hundredths : hundredths;
}

/** Renders an integer count of hundredths back into a two-decimal string. */
function fromMinorHundredths(hundredths: bigint): string {
  const magnitude = hundredths < 0n ? -hundredths : hundredths;
  const wholeUnits = magnitude / 100n;
  const fraction = String(magnitude % 100n).padStart(2, "0");
  return `${hundredths < 0n ? "-" : ""}${wholeUnits}.${fraction}`;
}

/** The currency carried by the most rows; ties keep the earliest-seen currency. */
function dominantCurrency(tallies: ReadonlyMap<CurrencyCode, number>): CurrencyCode {
  let winner = DEFAULT_TOTAL_CURRENCY;
  let winnerCount = 0;
  for (const [currency, count] of tallies) {
    if (count > winnerCount) {
      winner = currency;
      winnerCount = count;
    }
  }
  return winner;
}

/**
 * Derives the page-level aggregates in a single pass over the returned rows:
 * status tallies always expose every status key, the paid split is derived
 * from the calculation status, and the paid amount total is a precision-safe
 * decimal string. Because rows may mix currencies, the total is annotated
 * with the dominant currency of the page (the sum itself is unadjusted).
 */
function buildPageAggregates(rows: readonly SessionAuditReportRow[]): SessionAuditReportAggregates {
  const rowCountByStatus: Record<SessionAuditStatus, number> = { open: 0, end: 0, Absent: 0, absent_student: 0 };
  const currencyTallies = new Map<CurrencyCode, number>();
  let paid = 0;
  let totalHundredths = 0n;

  for (const row of rows) {
    rowCountByStatus[row.currentStatus] += 1;
    if (row.calculationStatus === CalculationStatus.PAID) paid += 1;
    if (row.teacherPaidAmount !== null) {
      const amount = toMinorHundredths(row.teacherPaidAmount);
      if (amount !== null) totalHundredths += amount;
    }
    if (row.teacherPaidCurrency !== null) {
      currencyTallies.set(row.teacherPaidCurrency, (currencyTallies.get(row.teacherPaidCurrency) ?? 0) + 1);
    }
  }

  return {
    rowCountByStatus,
    rowCountByPaid: { paid, unpaid: rows.length - paid },
    totalPaidAmount: fromMinorHundredths(totalHundredths),
    totalPaidCurrency: dominantCurrency(currencyTallies),
  };
}

/** Strict `YYYY-MM-DD` check that also rejects impossible calendar days (JS `Date` rolls them over). */
function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const constructed = new Date(Date.UTC(year, month - 1, day));
  return (
    constructed.getUTCFullYear() === year && constructed.getUTCMonth() === month - 1 && constructed.getUTCDate() === day
  );
}

/** Formats a UTC instant as its `YYYY-MM-DD` calendar date. */
function toUtcCalendarDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Fills both date bounds with the default window when the caller left them unset. */
function withDefaultDateRange(filters: SessionAuditReportFilters): SessionAuditReportFilters {
  if (filters.dateFrom != null || filters.dateTo != null) return filters;
  const dateTo = toUtcCalendarDate(new Date());
  const dateFrom = toUtcCalendarDate(new Date(Date.now() - DEFAULT_DATE_RANGE_DAYS * MILLIS_PER_DAY));
  return { ...filters, dateFrom, dateTo };
}

function assertValidDateRange(filters: SessionAuditReportFilters, tErrors: ErrorsLabels): void {
  const { dateFrom, dateTo } = filters;
  if ((dateFrom != null && !isCalendarDate(dateFrom)) || (dateTo != null && !isCalendarDate(dateTo))) {
    throw new ValidationError("INVALID_DATE_RANGE", tErrors.invalidInput);
  }
  if (dateFrom == null || dateTo == null) return;
  // Both bounds are calendar dates; ISO dates compare correctly as strings.
  if (dateFrom > dateTo) {
    throw new ValidationError("INVALID_DATE_RANGE", tErrors.invalidInput);
  }
}

export namespace SessionAuditService {
  /**
   * Reads one page of the session audit report: permission-gated,
   * date-validated (each bound must be a real calendar date, in ascending
   * order), sorted (scheduled start, newest first, when the caller supplies no
   * sort), and clamped to the last page when the requested offset runs past
   * the result set. With no date bounds at all, the report falls back to the
   * default 30-day window. Aggregates describe the returned page; `totalCount`
   * carries the size of the full filtered result.
   */
  export async function getReport(
    actorUserId: string,
    filters: SessionAuditReportFilters,
    sort: SessionAuditReportSort | null | undefined,
    pagination: { limit: number; offset: number },
    tErrors: ErrorsLabels
  ): Promise<SessionAuditReportPage> {
    await requirePermission(actorUserId, AppPermission.ACCOUNTING_REPORTS_VIEW, tErrors);
    assertValidDateRange(filters, tErrors);
    const resolvedFilters = withDefaultDateRange(filters);

    const resolvedSort = sort ?? DEFAULT_REPORT_SORT;
    let page = await SessionAuditRepository.findReportRows(resolvedFilters, resolvedSort, pagination);

    if (page.totalCount > 0 && pagination.offset >= page.totalCount) {
      const normalizedLimit = Math.max(1, Math.floor(pagination.limit));
      const lastPageOffset = Math.floor((page.totalCount - 1) / normalizedLimit) * normalizedLimit;
      page = await SessionAuditRepository.findReportRows(resolvedFilters, resolvedSort, {
        limit: pagination.limit,
        offset: lastPageOffset,
      });
    }

    logger.info("Session audit report query", {
      actorUserId,
      filters: resolvedFilters,
      limit: pagination.limit,
      offset: pagination.offset,
      rowCount: page.rows.length,
    });

    return { rows: page.rows, totalCount: page.totalCount, aggregates: buildPageAggregates(page.rows) };
  }
}
