"use client";

import { PaymentCatalogsView } from "@/frontend/common/views/dashboard/admin/payment-catalogs/PaymentCatalogsView";
import { usePaymentCatalogsTabsViewModel } from "@/frontend/common/views/dashboard/admin/payment-catalogs/tabs/usePaymentCatalogsTabsViewModel";

export function PaymentCatalogsPageContainer() {
  const viewModel = usePaymentCatalogsTabsViewModel();
  return <PaymentCatalogsView {...viewModel} />;
}
