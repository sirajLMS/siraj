"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import { PaymentCatalogsView } from "@/frontend/common/views/dashboard/admin/payment-catalogs/PaymentCatalogsView";
import { usePaymentCatalogsTabsViewModel } from "@/frontend/common/views/dashboard/admin/payment-catalogs/tabs/usePaymentCatalogsTabsViewModel";

export function PaymentCatalogsPageContainer() {
  const viewModel = usePaymentCatalogsTabsViewModel();
  return (
    <RequirePermission permissions={PAGE_PERMISSIONS.paymentCatalogsParent} fallback={null}>
      <PaymentCatalogsView {...viewModel} />
    </RequirePermission>
  );
}
