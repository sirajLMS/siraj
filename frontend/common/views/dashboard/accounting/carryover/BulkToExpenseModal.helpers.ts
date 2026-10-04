import type {
  CarryoverBalancesQuery_carryoverBalances_rows,
  CurrencyCode,
} from "@/frontend/common/graphql/generated/gql/graphql";

/** HTML id of the dialog form so the submit button in DialogActions can target it. */
export const FORM_ID = "carryover-bulk-to-expense-form";

/** Root field holding the carryover list page; dropped from the cache after a successful conversion. */
export const CARRYOVER_LIST_FIELD = "carryoverBalances";

/** Terminal domain rejection surfaced as a non-dismissible in-dialog banner. */
export const ALREADY_PAID_ERROR_CODE = "CARRYOVER_ALREADY_PAID";

/** Display + wire format for the payment date field (full calendar date). */
export const PAYMENT_DATE_FORMAT = "yyyy-MM-dd";

/** Display + wire format for the expense month field (year-month only). */
export const EXPENSE_MONTH_FORMAT = "yyyy-MM";

export const DATE_PAIR_SX = {
  display: "grid",
  gap: 2,
  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
} as const;

export type BulkToExpenseRow = Pick<
  CarryoverBalancesQuery_carryoverBalances_rows,
  "id" | "payable" | "teacherCurrency"
>;

/** A picker can hand over an invalid Date (unparseable keystrokes); those read as "missing". */
export function isValidDate(value: Date | null): value is Date {
  return value !== null && !Number.isNaN(value.getTime());
}

interface BulkSelectionSummary {
  readonly count: number;
  readonly totalAmount: string;
  readonly currency: CurrencyCode | null;
}

/** Cache of `Intl.NumberFormat` instances keyed by locale tag to avoid CPU and GC overhead in selection summaries. */
const summaryNumberFormatCache = new Map<string, Intl.NumberFormat>();

function getSummaryNumberFormat(locale: string): Intl.NumberFormat {
  let formatter = summaryNumberFormatCache.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    summaryNumberFormatCache.set(locale, formatter);
  }
  return formatter;
}

/**
 * Count, total, and currency line for the selection. The currency follows the
 * list aggregate convention (most rows win, ties go to the earliest-seen
 * currency) and the total sums every selected payable under the v1
 * single-dominant-currency assumption, formatted in the active locale.
 */
export function summarizeSelection(
  carryoverIds: readonly string[],
  rows: readonly BulkToExpenseRow[],
  locale: string
): BulkSelectionSummary {
  const selectedIds = new Set(carryoverIds);
  const counts = new Map<CurrencyCode, number>();
  let total = 0;
  for (const row of rows) {
    if (row.id === null || !selectedIds.has(row.id)) continue;
    const payable = Number(row.payable);
    if (!Number.isNaN(payable)) total += payable;
    if (row.teacherCurrency !== null) {
      counts.set(row.teacherCurrency, (counts.get(row.teacherCurrency) ?? 0) + 1);
    }
  }
  let currency: CurrencyCode | null = null;
  let leadingCount = 0;
  for (const [code, count] of counts) {
    if (count > leadingCount) {
      currency = code;
      leadingCount = count;
    }
  }
  const totalAmount = getSummaryNumberFormat(locale).format(total);
  return { count: carryoverIds.length, totalAmount, currency };
}

export { getGraphQLErrorCode, getGraphQLErrorMessage } from "@/frontend/common/views/dashboard/accounting/__shared__";

/** Omitted (null) when blank so an untouched note never reaches the wire. */
export function toOptionalNote(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed === "" ? null : trimmed;
}
