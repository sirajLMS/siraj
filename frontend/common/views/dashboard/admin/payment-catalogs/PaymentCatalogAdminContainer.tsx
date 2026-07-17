"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { PaymentCatalogAdminView } from "@/frontend/common/views/dashboard/admin/payment-catalogs/PaymentCatalogAdminView";
import {
  type PaymentCatalogAdminViewModel,
  type UsePaymentCatalogAdminViewModelProps,
  usePaymentCatalogAdminViewModel,
} from "@/frontend/common/views/dashboard/admin/payment-catalogs/usePaymentCatalogAdminViewModel";

export function PaymentCatalogAdminContainer(props: Readonly<UsePaymentCatalogAdminViewModelProps>) {
  const viewModel = usePaymentCatalogAdminViewModel(props);
  return (
    <RequirePermission permissions={[AppPermission.PaymentMethodsManageCatalogs]} fallback={null}>
      <PaymentCatalogAdminView {...viewModel} />
    </RequirePermission>
  );
}

export type { PaymentCatalogAdminViewModel, UsePaymentCatalogAdminViewModelProps };
