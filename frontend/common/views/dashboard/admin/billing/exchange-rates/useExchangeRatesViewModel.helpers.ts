import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { parseCurrencyCode } from "@/frontend/common/lib/currency";
import type { ExchangeRateRow } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/exchangeRatesColumns";

type ExchangeRateSourceRow = {
  readonly id?: string | null;
  readonly fromCurrency?: string | null;
  readonly toCurrency?: string | null;
  readonly rate?: string | null;
  readonly source?: string | null;
  readonly effectiveDate?: string | null;
};

export function mapExchangeRatesToRows(rates: readonly ExchangeRateSourceRow[] | null | undefined): ExchangeRateRow[] {
  return (rates ?? [])
    .filter((rate): rate is NonNullable<typeof rate> => rate?.id != null)
    .map(rate => ({
      id: rate.id ?? "",
      fromCurrency: parseCurrencyCode(rate.fromCurrency) ?? CurrencyCode.Usd,
      toCurrency: parseCurrencyCode(rate.toCurrency) ?? CurrencyCode.Sar,
      rate: rate.rate ?? "0",
      source: rate.source ?? null,
      effectiveDate: rate.effectiveDate ?? "",
    }));
}

export function buildAvailablePairs(rates: readonly ExchangeRateRow[]) {
  return rates.map(rate => ({ from: rate.fromCurrency, to: rate.toCurrency }));
}
