"use client";

import { BillingView } from "@/frontend/common/views/dashboard/billing/BillingView";
import { useBillingTabsViewModel } from "@/frontend/common/views/dashboard/billing/tabs/useBillingTabsViewModel";

export function BillingPageContainer() {
  const viewModel = useBillingTabsViewModel();

  return <BillingView {...viewModel} />;
}
