"use client";

import { SupportedCurrenciesView } from "@/frontend/common/views/dashboard/admin/billing/currencies/SupportedCurrenciesView";
import {
  type UseSupportedCurrenciesViewModelProps,
  useSupportedCurrenciesViewModel,
} from "@/frontend/common/views/dashboard/admin/billing/currencies/useSupportedCurrenciesViewModel";

export function SupportedCurrenciesContainer(_props: Readonly<UseSupportedCurrenciesViewModelProps>) {
  const viewModel = useSupportedCurrenciesViewModel({});

  return <SupportedCurrenciesView {...viewModel} />;
}
