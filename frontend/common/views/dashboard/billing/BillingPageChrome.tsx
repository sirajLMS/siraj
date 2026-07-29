"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { BillingTabsViewModel } from "@/frontend/common/views/dashboard/billing/tabs/useBillingTabsViewModel";

const lazyChrome = createLazyView<BillingTabsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/billing/billing.mobile").then(m => ({
      default: m.BillingMobileChrome,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/billing/billing.desktop").then(m => ({
      default: m.BillingDesktopChrome,
    }))
);

export function BillingPageChrome(viewModel: Readonly<BillingTabsViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyChrome.mobile} desktop={lazyChrome.desktop} props={viewModel} />;
}
