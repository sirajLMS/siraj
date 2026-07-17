"use client";

import { useMemo } from "react";
import { type CurrencyOption, currencies } from "@/frontend/common/lib/currency";
import { useAppTranslation } from "@/shared/locale";

export interface SupportedCurrenciesViewModel {
  readonly rows: ReadonlyArray<CurrencyOption & { readonly id: string }>;
  readonly emptyMessage: string;
  readonly footerNote: string;
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly flagColumnLabel: string;
  readonly codeColumnLabel: string;
  readonly symbolColumnLabel: string;
  readonly nameColumnLabel: string;
  readonly countryColumnLabel: string;
}

export type UseSupportedCurrenciesViewModelProps = Record<string, never>;

export function useSupportedCurrenciesViewModel(
  _props: Readonly<UseSupportedCurrenciesViewModelProps>
): SupportedCurrenciesViewModel {
  const t = useAppTranslation().dashboardTranslations.billing;

  const rows = useMemo(
    () =>
      currencies.map((currency, index) => ({
        id: `${currency.code}-${index}`,
        ...currency,
      })),
    []
  );

  return {
    rows,
    emptyMessage: t.supportedCurrencies.empty,
    footerNote: t.supportedCurrencies.footerNote,
    pageTitle: t.supportedCurrencies.pageTitle,
    pageSubtitle: t.supportedCurrencies.pageSubtitle,
    flagColumnLabel: t.supportedCurrencies.flag,
    codeColumnLabel: t.supportedCurrencies.code,
    symbolColumnLabel: t.supportedCurrencies.symbol,
    nameColumnLabel: t.supportedCurrencies.name,
    countryColumnLabel: t.supportedCurrencies.country,
  };
}
