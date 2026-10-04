import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import { type db, queryDb } from "@/backend/db";
import {
  buildBillingPageInfo,
  buildUnpaginatedBillingResult,
  isExchangeRateStale,
  mapExchangeRateHistoryRow,
} from "@/backend/db/repo/billing/billing-helpers";
import { currencyExchangeAuditLogs, currencyExchangeRates } from "@/backend/db/schema";
import type * as Types from "@/backend/types";
import type { CurrencyExchangeRateSubmitInput, DBQueryExecutor, DBTransaction } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ErrorsLabels } from "@/shared/locale";

const exchangeRateHistoryFields = {
  id: currencyExchangeRates.id,
  fromCurrency: currencyExchangeRates.fromCurrency,
  toCurrency: currencyExchangeRates.toCurrency,
  rate: currencyExchangeRates.rate,
  source: currencyExchangeRates.source,
  effectiveDate: currencyExchangeRates.effectiveDate,
};

/**
 * Fetches the most recent exchange-rate row for a pair with effectiveDate <= now.
 * Returns null when no rate exists.
 */
export async function fetchLatestExchangeRateRow(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  tx?: DBTransaction | typeof db
): Promise<Types.CurrencyExchangeRateSelectType | null> {
  const q = queryDb(tx);
  const now = new Date();
  const results = await q
    .select()
    .from(currencyExchangeRates)
    .where(
      and(
        eq(currencyExchangeRates.fromCurrency, fromCurrency),
        eq(currencyExchangeRates.toCurrency, toCurrency),
        lte(currencyExchangeRates.effectiveDate, now)
      )
    )
    .orderBy(desc(currencyExchangeRates.effectiveDate), desc(currencyExchangeRates.createdAt))
    .limit(1);

  return results[0] ?? null;
}

/** Resolves the latest rate for a pair, throwing when missing or stale. */
export async function findLatestExchangeRateOrThrow(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  tErrors: ErrorsLabels,
  tx?: DBTransaction | typeof db
): Promise<Types.CurrencyExchangeRateSelectType> {
  const latest = await fetchLatestExchangeRateRow(fromCurrency, toCurrency, tx);

  if (!latest) {
    throw new Error(
      tErrors.file.recordNotFound({
        tableName: "currency_exchange_rates",
        entityId: `${fromCurrency}_${toCurrency}`,
      })
    );
  }

  if (isExchangeRateStale(latest.effectiveDate)) {
    throw new Error(
      tErrors.billing.exchangeRateStale({
        fromCurrency,
        toCurrency,
      })
    );
  }

  return latest;
}

/**
 * Resolves the FX snapshot/source for a billing insert. When a snapshot is
 * already supplied (or the currency is USD) it is passed through untouched;
 * otherwise the latest non-USD rate is looked up.
 */
export async function resolveExchangeRateSnapshot(
  t: DBTransaction | typeof db,
  currency: CurrencyCode,
  tErrors: ErrorsLabels,
  snapshot?: string | null,
  source?: string | null
): Promise<{ snapshot: string | null; source: string | null }> {
  if (snapshot || currency === CurrencyCode.USD) {
    return { snapshot: snapshot ?? null, source: source ?? null };
  }

  const rate = await findLatestExchangeRateOrThrow(currency, CurrencyCode.USD, tErrors, t);
  return {
    snapshot: rate.rate,
    source: rate.source ?? "SYSTEM_AUTO",
  };
}

/**
 * Inserts a new exchange rate row and audit log entry within a single transaction.
 */
export async function writeExchangeRateWithAudit(
  t: DBTransaction,
  input: CurrencyExchangeRateSubmitInput,
  changedByUserId: string | null
): Promise<Types.CurrencyExchangeRateSelectType> {
  const results = await t
    .select()
    .from(currencyExchangeRates)
    .where(
      and(
        eq(currencyExchangeRates.fromCurrency, input.fromCurrency),
        eq(currencyExchangeRates.toCurrency, input.toCurrency)
      )
    )
    .orderBy(desc(currencyExchangeRates.effectiveDate))
    .limit(1);

  const oldRate = results[0];

  const [newRate] = await t
    .insert(currencyExchangeRates)
    .values({
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  await t.insert(currencyExchangeAuditLogs).values({
    fromCurrency: input.fromCurrency,
    toCurrency: input.toCurrency,
    oldRate: results.length > 0 ? oldRate.rate : null,
    newRate: input.rate,
    source: input.source ?? "MANUAL",
    changedByUserId,
    createdAt: new Date(),
  });

  return newRate;
}

/**
 * Fetches ordered rate rows and returns the first row per currency pair,
 * emulating `DISTINCT ON (from, to) ORDER BY effective_date DESC`.
 */
export async function collectLatestExchangeRates(
  q: DBQueryExecutor,
  pagination: Types.PaginationArgs | null
): Promise<Types.CurrencyExchangeRateReturnType[]> {
  const limit = pagination ? pagination.perPage : 200;
  const offset = pagination ? pagination.offset : 0;

  const rows = await q
    .select()
    .from(currencyExchangeRates)
    .orderBy(
      currencyExchangeRates.fromCurrency,
      currencyExchangeRates.toCurrency,
      desc(currencyExchangeRates.effectiveDate)
    )
    .limit(limit)
    .offset(offset);

  const seen = new Set<string>();
  const latest: Types.CurrencyExchangeRateReturnType[] = [];
  for (const row of rows) {
    const key = `${row.fromCurrency}:${row.toCurrency}`;
    if (seen.has(key)) continue;
    seen.add(key);
    latest.push({
      id: row.id,
      fromCurrency: row.fromCurrency,
      toCurrency: row.toCurrency,
      rate: row.rate,
      source: row.source,
      effectiveDate: row.effectiveDate,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  return latest;
}

/** Builds a paginated or capped exchange-rate history result for a currency pair. */
export async function buildExchangeRateHistoryResult(
  q: DBQueryExecutor,
  from: CurrencyCode,
  to: CurrencyCode,
  pagination: Types.PaginationArgs | null,
  maxDays: number
): Promise<Types.ExchangeRateHistoryPaginatedResult> {
  const whereCondition = and(
    eq(currencyExchangeRates.fromCurrency, from),
    eq(currencyExchangeRates.toCurrency, to),
    gte(currencyExchangeRates.effectiveDate, new Date(Date.now() - maxDays * 24 * 60 * 60 * 1000))
  );

  const historyId = `exchange-rate-history-${from}-${to}`;

  if (!pagination) {
    const rows = await q
      .select(exchangeRateHistoryFields)
      .from(currencyExchangeRates)
      .where(whereCondition)
      .orderBy(desc(currencyExchangeRates.effectiveDate))
      .limit(100);

    return buildUnpaginatedBillingResult(historyId, rows.map(mapExchangeRateHistoryRow));
  }

  const cap = Math.min(pagination.perPage, 100);
  const currentPage = pagination.currentPage;
  const offset = pagination.offset;

  const [dataRows, countResult] = await Promise.all([
    q
      .select(exchangeRateHistoryFields)
      .from(currencyExchangeRates)
      .where(whereCondition)
      .orderBy(desc(currencyExchangeRates.effectiveDate))
      .limit(cap)
      .offset(offset),
    q.select({ count: count() }).from(currencyExchangeRates).where(whereCondition),
  ]);

  const totalCount = countResult[0]?.count ?? 0;
  const lastPage = Math.max(1, Math.ceil(totalCount / cap));
  const rows = dataRows.map(mapExchangeRateHistoryRow);

  return {
    id: historyId,
    rows,
    totalCount,
    pageInfo: buildBillingPageInfo(rows.length, currentPage, offset, totalCount, cap, lastPage),
  };
}

/** Upserts exchange-rate rows sequentially so each pair keeps a stable order. */
export async function upsertExchangeRateRows(
  t: DBTransaction | typeof db,
  inputs: readonly CurrencyExchangeRateSubmitInput[]
): Promise<Types.CurrencyExchangeRateSelectType[]> {
  const now = new Date();

  return inputs.reduce(async (prevPromise, input) => {
    const acc = await prevPromise;
    const [row] = await t
      .insert(currencyExchangeRates)
      .values({
        ...input,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          currencyExchangeRates.fromCurrency,
          currencyExchangeRates.toCurrency,
          currencyExchangeRates.effectiveDate,
        ],
        set: { rate: input.rate, updatedAt: now },
      })
      .returning();
    if (row) acc.push(row);
    return acc;
  }, Promise.resolve<Types.CurrencyExchangeRateSelectType[]>([]));
}
