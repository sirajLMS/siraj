import { and, type SQL } from "drizzle-orm";
import { db } from "@/backend/db";
import type * as Types from "@/backend/types";
import type { DBTransaction, ExchangeRateHistoryRow } from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

/** Formats a SQL amount string/number into a fixed two-decimal display string. */
export function formatBillingAmount(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "0.00";
  const num = typeof val === "number" ? val : Number.parseFloat(val);
  return Number.isFinite(num) ? num.toFixed(2) : "0.00";
}

/** Aggregates per-row amounts into one total per distinct currency. */
export function groupBillingAmountsByCurrency(
  rows: readonly { amount: string; currency: CurrencyCode }[],
  idPrefix: string
): Types.BillingCurrencyTotal[] {
  const byCurrency = new Map<CurrencyCode, number>();
  for (const row of rows) {
    const numericAmount = Number.parseFloat(row.amount);
    if (!Number.isFinite(numericAmount)) continue;
    byCurrency.set(row.currency, (byCurrency.get(row.currency) ?? 0) + numericAmount);
  }
  return [...byCurrency.entries()].map(([currency, amount]) => ({
    id: `${idPrefix}-${currency}`,
    currency,
    amount: amount.toFixed(2),
  }));
}

/** Builds pagination metadata for offset/limit result sets. */
export function buildBillingPageInfo(
  rowCount: number,
  currentPage: number,
  offset: number,
  totalCount: number,
  perPage: number,
  lastPage: number
): Types.PageInfo {
  return {
    count: rowCount,
    currentPage,
    firstItem: rowCount > 0 ? offset + 1 : null,
    lastItem: rowCount > 0 ? offset + rowCount : null,
    hasMorePages: currentPage < lastPage,
    lastPage,
    perPage,
    total: totalCount,
  };
}

/** Wraps an unpaginated row set in the paginated-result envelope with `pageInfo: null`. */
export function buildUnpaginatedBillingResult<TRow>(
  id: string,
  rows: TRow[]
): { id: string; rows: TRow[]; totalCount: number; pageInfo: null } {
  return { id, rows, totalCount: rows.length, pageInfo: null };
}

/** Combines optional SQL conditions, collapsing empty/single cases. */
export function mergeBillingWhereConditions(...conditions: (SQL | undefined)[]): SQL | undefined {
  const merged = conditions.filter((condition): condition is SQL => condition !== undefined);
  if (merged.length === 0) {
    return undefined;
  }
  if (merged.length === 1) {
    return merged[0];
  }
  return and(...merged);
}

/** An exchange rate older than 24 hours is considered stale. */
export function isExchangeRateStale(effectiveDate: Date): boolean {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return effectiveDate < twentyFourHoursAgo;
}

/** Narrows a raw exchange-rate history row to the public return shape. */
export function mapExchangeRateHistoryRow(r: ExchangeRateHistoryRow): Types.ExchangeRateHistoryRow {
  return {
    id: r.id,
    fromCurrency: r.fromCurrency,
    toCurrency: r.toCurrency,
    rate: r.rate,
    source: r.source,
    effectiveDate: r.effectiveDate,
  };
}

/** Runs a batch of returning inserts in a caller transaction or a new one. */
export async function upsertManyWithRunner<TRow>(
  tx: DBTransaction | undefined,
  runInserts: (t: DBTransaction) => Promise<TRow[][]>
): Promise<TRow[]> {
  const runner = async (t: DBTransaction) => {
    const inserted = await runInserts(t);
    return inserted.flatMap(rows => (rows[0] ? [rows[0]] : []));
  };
  return tx ? runner(tx) : db.transaction(runner);
}
