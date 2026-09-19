import { BillingRepository } from "@/backend/db/repo/billing";
import { DomainError, PROFIT_LOSS_MONTH_PATTERN } from "@/backend/lib";
import type {
  FxWarning,
  ProfitLossExpensesPage,
  ProfitLossIncomePage,
  ProfitLossPagination,
  ProfitLossPaymentsPage,
  ProfitLossSummary,
} from "@/backend/types";
import { PaginationArgs } from "@/backend/types/shared/pagination.types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ProfitLossLabels } from "@/shared/locale/types/dashboard/accounting";

/** Fallback currency for report aggregates when a page carries no convertible rows. */
const FALLBACK_REPORT_CURRENCY = CurrencyCode.SAR;

/** Renders a numeric amount as the canonical two-decimal money string; unparseable values render as "0". */
function toTwoDecimalString(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "0";
}

/** Converts a decimal-string amount by a decimal-string rate. */
function multiplyAmountByRate(amount: string, rate: string): string {
  return toTwoDecimalString(Number.parseFloat(amount) * Number.parseFloat(rate));
}

/**
 * Request-scoped memoized FX rate lookup: one {@link BillingRepository.getLatestExchangeRateForDisplay}
 * DB read per (from, to) pair, shared by every row of a report. Page builders
 * convert per row for display and FX warnings, and the aggregate re-converts
 * the same rows — without a shared lookup that doubles into thousands of
 * redundant DB reads on large pages. A missing or stale rate caches as null.
 */
export type FxRateLookup = (from: CurrencyCode, to: CurrencyCode) => Promise<{ rate: string; stale: boolean } | null>;

/** Per-call lookup used when no request-scoped lookup is supplied (legacy behavior). */
const defaultFxRateLookup: FxRateLookup = async (from, to) => {
  const latest = await BillingRepository.getLatestExchangeRateForDisplay(from, to);
  return latest.rate == null || latest.stale ? null : { rate: latest.rate, stale: latest.stale };
};

/** Creates one memoized lookup per report request; concurrent rows share a single DB read per pair. */
export function createFxRateLookup(): FxRateLookup {
  const cache = new Map<CurrencyCode, Map<CurrencyCode, Promise<{ rate: string; stale: boolean } | null>>>();
  return (from, to) => {
    const byTarget = cache.get(from) ?? new Map<CurrencyCode, Promise<{ rate: string; stale: boolean } | null>>();
    let pending = byTarget.get(to);
    if (!pending) {
      pending = BillingRepository.getLatestExchangeRateForDisplay(from, to).then(latest =>
        latest.rate == null || latest.stale ? null : { rate: latest.rate, stale: latest.stale }
      );
      byTarget.set(to, pending);
    }
    cache.set(from, byTarget);
    return pending;
  };
}

/**
 * Converts a stored decimal-string amount into the target currency through the
 * latest FX rate. Same-currency amounts pass through without a rate lookup; a
 * missing or stale rate returns null so the caller can exclude the row from
 * aggregates and surface it as an FX warning instead.
 */
export async function convertCurrency(
  amount: string,
  from: CurrencyCode,
  to: CurrencyCode,
  rateLookup: FxRateLookup = defaultFxRateLookup
): Promise<string | null> {
  if (from === to) {
    return toTwoDecimalString(Number.parseFloat(amount));
  }

  const latest = await rateLookup(from, to);
  if (latest == null) {
    return null;
  }
  return multiplyAmountByRate(amount, latest.rate);
}

/** Currency carried by the most included rows. Ties resolve to the currency that reached the leading count first. */
function pickDominantSourceCurrency(counts: ReadonlyMap<CurrencyCode, number>): CurrencyCode {
  let dominant: CurrencyCode | null = null;
  let leadingCount = 0;
  for (const [currency, count] of counts) {
    if (count > leadingCount) {
      dominant = currency;
      leadingCount = count;
    }
  }
  return dominant ?? FALLBACK_REPORT_CURRENCY;
}

/**
 * Aggregates one report page into the target currency: each row's amount is
 * converted through the latest FX rate, FX-missing rows are excluded from the
 * sum and counted, and the dominant currency is the source currency carried by
 * the most included rows. An included-row set with no rows (empty page, or
 * every row FX-missing) falls back to the default report currency so the
 * aggregate stays labeled.
 */
export async function aggregateWithFx<Row>(
  rows: readonly Row[],
  getAmount: (row: Row) => string,
  getCurrency: (row: Row) => CurrencyCode,
  targetCurrency: CurrencyCode,
  rateLookup: FxRateLookup = defaultFxRateLookup
): Promise<{ sum: string; dominantCurrency: CurrencyCode; excludedRowCount: number }> {
  const conversions = await Promise.all(
    rows.map(async row => ({
      converted: await convertCurrency(getAmount(row), getCurrency(row), targetCurrency, rateLookup),
      source: getCurrency(row),
    }))
  );

  let sum = 0;
  let excludedRowCount = 0;
  const sourceCurrencyCounts = new Map<CurrencyCode, number>();
  for (const { converted, source } of conversions) {
    if (converted == null) {
      excludedRowCount += 1;
      continue;
    }
    sum += Number(converted);
    sourceCurrencyCounts.set(source, (sourceCurrencyCounts.get(source) ?? 0) + 1);
  }
  return {
    sum: toTwoDecimalString(sum),
    dominantCurrency: pickDominantSourceCurrency(sourceCurrencyCounts),
    excludedRowCount,
  };
}

/**
 * Groups the report's FX-excluded rows (those whose per-row conversion is
 * null) by currency pair, with one warning per pair and the excluded row
 * count. Rows that converted successfully never produce a warning.
 */
export function collectFxWarnings(
  rowsByGroup: ReadonlyArray<ReadonlyArray<{ originalCurrency: CurrencyCode; convertedAmount: string | null }>>,
  targetCurrency: CurrencyCode
): FxWarning[] {
  const counts = new Map<CurrencyCode, number>();
  for (const rows of rowsByGroup) {
    for (const row of rows) {
      if (row.convertedAmount != null) continue;
      counts.set(row.originalCurrency, (counts.get(row.originalCurrency) ?? 0) + 1);
    }
  }
  return [...counts.entries()].map(([originalCurrency, rowCount]) => ({
    originalCurrency,
    targetCurrency,
    rowCount,
  }));
}

/**
 * Builds the executive summary for the selected month in the target currency.
 * Net Profit = Total Payments − Total Expenses; the Net Profit Margin is the
 * net profit as a percentage of Total Payments (one decimal place) whenever
 * Total Payments are positive, and null otherwise (no income base to divide
 * by). All monetary values render as two-decimal strings.
 */
export function composeProfitsSummary(
  currency: CurrencyCode,
  paymentsAggregate: ProfitLossPaymentsPage["aggregate"],
  expensesAggregate: ProfitLossExpensesPage["aggregate"],
  incomeAggregate: ProfitLossIncomePage["aggregate"]
): ProfitLossSummary {
  const totalPayments = Number(paymentsAggregate.totalPayments);
  const totalExpenses = Number(expensesAggregate.totalExpenses);
  const totalIncome = Number(incomeAggregate.totalIncomePayments);
  const netProfit = totalPayments - totalExpenses;
  const netProfitMargin = totalPayments > 0 ? ((netProfit / totalPayments) * 100).toFixed(1) : null;

  return {
    totalIncomePayments: totalIncome.toFixed(2),
    totalPayments: totalPayments.toFixed(2),
    totalExpenses: totalExpenses.toFixed(2),
    netProfit: netProfit.toFixed(2),
    netProfitMargin,
    currency,
  };
}

/**
 * Validates the report's global month filter: it must be well-shaped
 * (YYYY-MM) and a real calendar month (01–12). A pattern-only check would let
 * `2026-13` through and then be refused back by the month filters and the CSV
 * export.
 */
export function validateMonth(month: string, tErrors: ProfitLossLabels): void {
  if (!PROFIT_LOSS_MONTH_PATTERN.test(month)) {
    throw new DomainError("MONTH_INVALID", tErrors.error.monthInvalid);
  }
  const monthPart = Number(month.slice(5, 7));
  if (monthPart < 1 || monthPart > 12) {
    throw new DomainError("MONTH_INVALID", tErrors.error.monthInvalid);
  }
}

/** Upper bound for a per-tab page size; matches the repo-wide PaginationArgs clamp. */
const MAX_PAGE_LIMIT = PaginationArgs.MAX_COUNT;

/**
 * Validates the per-tab pagination knobs: limits must be positive integers no
 * larger than the page ceiling and offsets must be zero-or-positive integers.
 * Rejecting negative or oversized values here keeps hostile GraphQL arguments
 * from reaching the repository layer as unbounded window reads.
 */
export function validatePagination(pagination: ProfitLossPagination, tErrors: ProfitLossLabels): void {
  const entries: ReadonlyArray<readonly [string, number | undefined, "limit" | "offset"]> = [
    ["paymentsLimit", pagination.paymentsLimit, "limit"],
    ["paymentsOffset", pagination.paymentsOffset, "offset"],
    ["expensesLimit", pagination.expensesLimit, "limit"],
    ["expensesOffset", pagination.expensesOffset, "offset"],
    ["incomePaymentsLimit", pagination.incomePaymentsLimit, "limit"],
    ["incomePaymentsOffset", pagination.incomePaymentsOffset, "offset"],
  ];
  for (const [, value, kind] of entries) {
    if (value == null) continue;
    if (!Number.isInteger(value)) {
      throw new DomainError("PAGINATION_INVALID", tErrors.error.paginationInvalid);
    }
    if (kind === "limit" && (value < 1 || value > MAX_PAGE_LIMIT)) {
      throw new DomainError("PAGINATION_INVALID", tErrors.error.paginationInvalid);
    }
    if (kind === "offset" && value < 0) {
      throw new DomainError("PAGINATION_INVALID", tErrors.error.paginationInvalid);
    }
  }
}
