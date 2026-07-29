"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import { BillingView } from "@/frontend/common/views/dashboard/billing/BillingView";
import { useBillingTabsViewModel } from "@/frontend/common/views/dashboard/billing/tabs/useBillingTabsViewModel";

export function BillingPageContainer() {
  const viewModel = useBillingTabsViewModel();

  return (
    <RequirePermission permissions={PAGE_PERMISSIONS.billingAdmin} fallback={null}>
      <BillingView {...viewModel} />
    </RequirePermission>
  );
}
