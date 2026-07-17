"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { CurrencyHedgesView } from "@/frontend/common/views/dashboard/admin/billing/currency-hedges/CurrencyHedgesView";
import {
  type CurrencyHedgesViewModel,
  type UseCurrencyHedgesViewModelProps,
  useCurrencyHedgesViewModel,
} from "@/frontend/common/views/dashboard/admin/billing/currency-hedges/useCurrencyHedgesViewModel";

export function CurrencyHedgesContainer(_props: Readonly<UseCurrencyHedgesViewModelProps>) {
  const viewModel = useCurrencyHedgesViewModel({});

  return (
    <RequirePermission permissions={[AppPermission.BillingManageCurrencyHedges]} fallback={null}>
      <CurrencyHedgesView {...viewModel} />
    </RequirePermission>
  );
}

export type { CurrencyHedgesViewModel, UseCurrencyHedgesViewModelProps };
