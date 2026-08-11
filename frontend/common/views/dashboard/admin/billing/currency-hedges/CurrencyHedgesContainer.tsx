"use client";

import { CurrencyHedgesView } from "@/frontend/common/views/dashboard/admin/billing/currency-hedges/CurrencyHedgesView";
import {
  type UseCurrencyHedgesViewModelProps,
  useCurrencyHedgesViewModel,
} from "@/frontend/common/views/dashboard/admin/billing/currency-hedges/useCurrencyHedgesViewModel";

export function CurrencyHedgesContainer(_props: Readonly<UseCurrencyHedgesViewModelProps>) {
  const viewModel = useCurrencyHedgesViewModel({});

  return <CurrencyHedgesView {...viewModel} />;
}
