"use client";

import { useQuery } from "@apollo/client/react";
import { useEffect } from "react";
import { supportedCurrenciesQueryDocument } from "@/frontend/graphql/sharedDocuments/billing/currency-catalog.documents";
import { useCurrencyStore } from "@/frontend/stores/currencyStore";

export function useCurrencyCatalog(): {
  readonly options: ReturnType<typeof useCurrencyStore.getState>["options"];
  readonly loading: boolean;
} {
  const options = useCurrencyStore(state => state.options);
  const setCatalog = useCurrencyStore(state => state.setCatalog);
  const { data, loading } = useQuery(supportedCurrenciesQueryDocument, {
    variables: { activeOnly: true },
    fetchPolicy: "cache-first",
  });

  useEffect(() => {
    const rows = data?.supportedCurrencies
      ?.filter((row): row is typeof row & { code: NonNullable<typeof row.code> } => row.code != null)
      .map(row => ({
        code: row.code,
        symbol: row.symbol ?? row.code,
        countryCode: row.countryCode,
        decimals: row.decimals,
        sortOrder: row.sortOrder ?? undefined,
        isActive: row.isActive,
      }));
    if (rows && rows.length > 0) {
      setCatalog(rows);
    }
  }, [data?.supportedCurrencies, setCatalog]);

  return { options, loading };
}
