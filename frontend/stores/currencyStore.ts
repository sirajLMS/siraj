import { create } from "zustand";
import type { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import type { CurrencyOption } from "@/frontend/lib/currency";
import { countryCodeToEmoji } from "@/frontend/lib/locale";
import { staticCurrencyCatalog } from "@/frontend/lib/static-currency-catalog";

export interface CurrencyCatalogState {
  options: readonly CurrencyOption[];
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

export const useCurrencyStore = create<CurrencyCatalogState>(set => ({
  options: staticCurrencyCatalog,
  loaded: false,
  setCatalog: rows => {
    const options = rows.filter(row => row.isActive !== false).map(toCurrencyOption);
    set({
      options: options.length > 0 ? options : staticCurrencyCatalog,
      loaded: true,
    });
  },
  resetToStatic: () => set({ options: staticCurrencyCatalog, loaded: false }),
}));

export const mockCurrencyStore = {
  preloadStatic: () => {
    useCurrencyStore.getState().resetToStatic();
  },
};
