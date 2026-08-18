"use client";

import { create } from "zustand";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { type CurrencyOption, currencies } from "@/frontend/common/lib/currency";
import { countryCodeToEmoji } from "@/frontend/common/lib/locale";

export interface CurrencyCatalogState {
  options: readonly CurrencyOption[];
  /** false = using static fallback, true = DB catalog has been loaded */
  loaded: boolean;
  setCatalog: (rows: readonly SupportedCurrencyRow[]) => void;
  resetToStatic: () => void;
}

export type SupportedCurrencyRow = {
  readonly code: CurrencyCode;
  readonly symbol: string;
  readonly countryCode?: string | null;
  readonly decimals?: number | null;
  readonly sortOrder?: number;
  readonly isActive?: boolean | null;
};

function toCurrencyOption(row: SupportedCurrencyRow): CurrencyOption {
  const countryCode = row.countryCode ?? "US";
  return {
    code: row.code,
    symbol: row.symbol,
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
