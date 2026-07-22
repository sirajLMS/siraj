// NEW FOR PLAN v5: Common hook that owns the exchange-rate history query,
// local UI state (selected pair + max-days window), and derived option lists.
// Lifted verbatim from the inline implementations that previously lived in
// both exchangeRateHistorySection.mobile.tsx and .desktop.tsx (Class B
// duplicate per specs.md §4.1). The hook is now composed by the parent
// useExchangeRatesViewModel and passed down to the tier section as a prop
// (specs §3 N26 + §6.1 — tier views never call *ViewModel hooks directly).
import { useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { exchangeRateHistoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { parseCurrencyCode } from "@/frontend/common/lib/currency";
import type { ExchangeRateRow } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/exchangeRatesColumns";
import {
  EXCHANGE_RATE_HISTORY_DAY_OPTIONS,
  type ExchangeRateHistoryMaxDays,
} from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/types/exchangeRateHistory.types";

export interface UseExchangeRateHistoryViewModel {
  readonly fromCurrency: CurrencyCode;
  readonly toCurrency: CurrencyCode;
  readonly maxDays: ExchangeRateHistoryMaxDays;
  readonly rows: ExchangeRateRow[];
  readonly loading: boolean;
  readonly fromOptions: readonly CurrencyCode[];
  readonly toOptions: readonly CurrencyCode[];
  readonly dayOptions: typeof EXCHANGE_RATE_HISTORY_DAY_OPTIONS;
  readonly onFromCurrencyChange: (value: CurrencyCode) => void;
  readonly onToCurrencyChange: (value: CurrencyCode) => void;
  readonly onMaxDaysChange: (value: ExchangeRateHistoryMaxDays) => void;
}

// NEW FOR PLAN v5: dedicated input shape for the composed hook — accepts the
// availablePairs derived in the parent ViewModel; the parent supplies it.
export interface UseExchangeRateHistoryViewModelInput {
  readonly availablePairs: ReadonlyArray<{ readonly from: CurrencyCode; readonly to: CurrencyCode }>;
}

export function useExchangeRateHistoryViewModel(
  props: Readonly<UseExchangeRateHistoryViewModelInput>
): UseExchangeRateHistoryViewModel {
  const { availablePairs } = props;
  const defaultPair = availablePairs[0] ?? { from: CurrencyCode.Usd, to: CurrencyCode.Sar };
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>(defaultPair.from);
  const [toCurrency, setToCurrency] = useState<CurrencyCode>(defaultPair.to);
  const [maxDays, setMaxDays] = useState<ExchangeRateHistoryMaxDays>(90);

  const { data, loading } = useQuery(exchangeRateHistoryQueryDocument, {
    variables: {
      from: fromCurrency,
      to: toCurrency,
      maxDays,
      paginationArgs: null,
    },
    fetchPolicy: "cache-and-network",
  });

  const rows: ExchangeRateRow[] = (data?.exchangeRateHistory?.rows ?? [])
    .filter((rate): rate is NonNullable<typeof rate> => rate?.id != null)
    .map(rate => ({
      id: rate.id ?? "",
      fromCurrency: parseCurrencyCode(rate.fromCurrency) ?? fromCurrency,
      toCurrency: parseCurrencyCode(rate.toCurrency) ?? toCurrency,
      rate: rate.rate ?? "0",
      source: rate.source ?? null,
      effectiveDate: rate.effectiveDate ?? "",
    }));

  const fromOptions = useMemo(
    () => [...new Set(availablePairs.map(pair => pair.from))] as readonly CurrencyCode[],
    [availablePairs]
  );
  const toOptions = useMemo(
    () =>
      [
        ...new Set(availablePairs.filter(pair => pair.from === fromCurrency).map(pair => pair.to)),
      ] as readonly CurrencyCode[],
    [availablePairs, fromCurrency]
  );

  return {
    fromCurrency,
    toCurrency,
    maxDays,
    rows,
    loading,
    fromOptions,
    toOptions,
    dayOptions: EXCHANGE_RATE_HISTORY_DAY_OPTIONS,
    onFromCurrencyChange: setFromCurrency,
    onToCurrencyChange: setToCurrency,
    onMaxDaysChange: setMaxDays,
  };
}
