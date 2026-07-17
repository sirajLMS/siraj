"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type {
  SupportedMobileWalletFieldsFragment,
  SupportedOnlineAccountFieldsFragment,
  SupportedPaymentLinkFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/operations";
import type {
  PaymentCatalogKind,
  PaymentCatalogRow,
} from "@/frontend/common/views/dashboard/admin/payment-catalogs/types";

export interface PaymentCatalogAdminViewModel {
  readonly activeTab: PaymentCatalogKind;
  readonly onTabChange: (tab: PaymentCatalogKind) => void;
  readonly mobileWallets: readonly SupportedMobileWalletFieldsFragment[];
  readonly paymentLinks: readonly SupportedPaymentLinkFieldsFragment[];
  readonly onlineAccounts: readonly SupportedOnlineAccountFieldsFragment[];
  readonly loading?: boolean;
  readonly onAdd: () => void;
  readonly onEdit: (row: PaymentCatalogRow) => void;
  readonly onDelete: (row: PaymentCatalogRow) => void;
}

const lazyViews = createLazyView<PaymentCatalogAdminViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/admin/payment-catalogs/paymentCatalogAdmin.mobile").then(m => ({
      default: m.PaymentCatalogAdminMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/admin/payment-catalogs/paymentCatalogAdmin.desktop").then(m => ({
      default: m.PaymentCatalogAdminDesktopView,
    }))
);

export function PaymentCatalogAdminView(props: Readonly<PaymentCatalogAdminViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
