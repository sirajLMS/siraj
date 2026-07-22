"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { PaymentCatalogAdminViewModel } from "@/frontend/common/views/dashboard/admin/payment-catalogs/usePaymentCatalogAdminViewModel";

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
