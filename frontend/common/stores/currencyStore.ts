"use client";

import { create } from "zustand";
import type { CurrencyCode, SupportedCurrencyFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import { type CurrencyOption, currencies } from "@/frontend/common/lib/currency";
import { countryCodeToEmoji } from "@/frontend/common/lib/locale";

export type SupportedCurrencyRow = Pick<
  SupportedCurrencyFieldsFragment,
  "code" | "symbol" | "countryCode" | "decimals" | "sortOrder" | "isActive"
> & { readonly code: CurrencyCode };

export interface CurrencyCatalogState {
  options: readonly CurrencyOption[];
  /** false = using static fallback, true = DB catalog has been loaded */
  loaded: boolean;
  setCatalog: (rows: readonly SupportedCurrencyRow[]) => void;
  resetToStatic: () => void;
}

function toCurrencyOption(row: SupportedCurrencyRow): CurrencyOption {
  const countryCode = row.countryCode ?? "US";
  return {
    code: row.code,
    symbol: row.symbol ?? row.code,
    countryCode,
    flagEmoji: countryCodeToEmoji(countryCode),
  };
}

function filterActive(rows: readonly SupportedCurrencyRow[]): CurrencyOption[] {
  return rows.filter(row => row.isActive !== false).map(toCurrencyOption);
}

export const useCurrencyStore = create<CurrencyCatalogState>(set => ({
  options: currencies,
  loaded: false,
  setCatalog: rows => {
    const options = filterActive(rows);
    set({
      options: options.length > 0 ? options : Array.from(currencies),
      loaded: true,
    });
  },
  resetToStatic: () => set({ options: Array.from(currencies), loaded: false }),
}));

export const mockCurrencyStore = {
  preloadStatic: () => {
    useCurrencyStore.getState().resetToStatic();
  },
};
