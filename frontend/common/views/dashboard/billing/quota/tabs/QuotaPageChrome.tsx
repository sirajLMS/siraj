"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { QuotaTabsViewModel } from "@/frontend/common/views/dashboard/billing/quota/tabs/types";

const lazyChrome = createLazyView<QuotaTabsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/billing/quota/quotaPage.mobile").then(m => ({
      default: m.QuotaMobilePageChrome,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/billing/quota/quotaPage.desktop").then(m => ({
      default: m.QuotaDesktopPageChrome,
    }))
);

export function QuotaPageChrome(viewModel: Readonly<QuotaTabsViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyChrome.mobile} desktop={lazyChrome.desktop} props={viewModel} />;
}
