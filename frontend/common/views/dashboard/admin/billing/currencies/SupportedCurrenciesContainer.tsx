"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { SupportedCurrenciesView } from "@/frontend/common/views/dashboard/admin/billing/currencies/SupportedCurrenciesView";
import {
  type SupportedCurrenciesViewModel,
  type UseSupportedCurrenciesViewModelProps,
  useSupportedCurrenciesViewModel,
} from "@/frontend/common/views/dashboard/admin/billing/currencies/useSupportedCurrenciesViewModel";

export function SupportedCurrenciesContainer(_props: Readonly<UseSupportedCurrenciesViewModelProps>) {
  const viewModel = useSupportedCurrenciesViewModel({});

  return (
    <RequirePermission permissions={[AppPermission.BillingViewExchangeRates]} fallback={null}>
      <SupportedCurrenciesView {...viewModel} />
    </RequirePermission>
  );
}

export type { SupportedCurrenciesViewModel, UseSupportedCurrenciesViewModelProps };
