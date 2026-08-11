"use client";

import { PaymentCatalogAdminView } from "@/frontend/common/views/dashboard/admin/payment-catalogs/PaymentCatalogAdminView";
import {
  type UsePaymentCatalogAdminViewModelProps,
  usePaymentCatalogAdminViewModel,
} from "@/frontend/common/views/dashboard/admin/payment-catalogs/usePaymentCatalogAdminViewModel";

export function PaymentCatalogAdminContainer(props: Readonly<UsePaymentCatalogAdminViewModelProps>) {
  const viewModel = usePaymentCatalogAdminViewModel(props);
  return <PaymentCatalogAdminView {...viewModel} />;
}
