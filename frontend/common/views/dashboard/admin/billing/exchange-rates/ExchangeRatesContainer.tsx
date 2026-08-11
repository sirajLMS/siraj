"use client";

import { ExchangeRatesView } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/ExchangeRatesView";
import {
  type UseExchangeRatesViewModelProps,
  useExchangeRatesViewModel,
} from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/useExchangeRatesViewModel";

export function ExchangeRatesContainer(_props: Readonly<UseExchangeRatesViewModelProps>) {
  const viewModel = useExchangeRatesViewModel({});

  return <ExchangeRatesView {...viewModel} />;
}
