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

function assertValidDateRange(filters: SessionAuditReportFilters, tErrors: ErrorsLabels): void {
  const { dateFrom, dateTo } = filters;
  if (dateFrom == null || dateTo == null) return;
  // Both bounds are ISO dates; ISO calendar dates compare correctly as strings.
  if (dateFrom > dateTo) {
    throw new ValidationError("INVALID_DATE_RANGE", tErrors.invalidInput);
  }
}

export namespace SessionAuditService {
  /**
   * Reads one page of the session audit report: permission-gated,
   * date-range-validated, sorted (scheduled start, newest first, when the
   * caller supplies no sort), and clamped to the last page when the requested
   * offset runs past the result set. Aggregates describe the returned page;
   * `totalCount` carries the size of the full filtered result.
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

    const resolvedSort = sort ?? DEFAULT_REPORT_SORT;
    let page = await SessionAuditRepository.findReportRows(filters, resolvedSort, pagination);

    if (page.totalCount > 0 && pagination.offset >= page.totalCount) {
      const normalizedLimit = Math.max(1, Math.floor(pagination.limit));
      const lastPageOffset = Math.floor((page.totalCount - 1) / normalizedLimit) * normalizedLimit;
      page = await SessionAuditRepository.findReportRows(filters, resolvedSort, {
        limit: pagination.limit,
        offset: lastPageOffset,
      });
    }

    logger.info("Session audit report query", {
      actorUserId,
      filters,
      limit: pagination.limit,
      offset: pagination.offset,
      rowCount: page.rows.length,
    });

    return { rows: page.rows, totalCount: page.totalCount, aggregates: buildPageAggregates(page.rows) };
  }
}
