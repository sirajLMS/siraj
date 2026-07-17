"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ExchangeRatesView } from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/ExchangeRatesView";
import {
  type ExchangeRatesViewModel,
  type UseExchangeRatesViewModelProps,
  useExchangeRatesViewModel,
} from "@/frontend/common/views/dashboard/admin/billing/exchange-rates/useExchangeRatesViewModel";

export function ExchangeRatesContainer(_props: Readonly<UseExchangeRatesViewModelProps>) {
  const viewModel = useExchangeRatesViewModel({});

  return (
    <RequirePermission permissions={[AppPermission.BillingViewExchangeRates]} fallback={null}>
      <ExchangeRatesView {...viewModel} />
    </RequirePermission>
  );
}

export type { ExchangeRatesViewModel, UseExchangeRatesViewModelProps };
