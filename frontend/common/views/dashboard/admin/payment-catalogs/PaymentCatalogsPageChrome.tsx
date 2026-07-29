"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { PaymentCatalogsTabsViewModel } from "@/frontend/common/views/dashboard/admin/payment-catalogs/tabs/usePaymentCatalogsTabsViewModel";

const lazyChrome = createLazyView<PaymentCatalogsTabsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/admin/payment-catalogs/paymentCatalogsParent.mobile").then(m => ({
      default: m.PaymentCatalogsMobileChrome,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/admin/payment-catalogs/paymentCatalogsParent.desktop").then(m => ({
      default: m.PaymentCatalogsDesktopChrome,
    }))
);

export function PaymentCatalogsPageChrome(viewModel: Readonly<PaymentCatalogsTabsViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyChrome.mobile} desktop={lazyChrome.desktop} props={viewModel} />;
}
