"use client";

import { QuotaPageView } from "@/frontend/common/views/dashboard/billing/quota/tabs/QuotaPageView";
import { useQuotaTabsViewModel } from "@/frontend/common/views/dashboard/billing/quota/tabs/useQuotaTabsViewModel";

export function QuotaPageContainer() {
  const viewModel = useQuotaTabsViewModel();

  return <QuotaPageView {...viewModel} />;
}
