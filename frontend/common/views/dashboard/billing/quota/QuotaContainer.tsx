"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { useQuotaViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaViewModel";

const lazyViews = createLazyView<ReturnType<typeof useQuotaViewModel>>(
  () =>
    import("@/frontend/mobile/views/dashboard/billing/quota/quotaList.mobile").then(m => ({
      default: m.QuotaListMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/billing/quota/quotaList.desktop").then(m => ({
      default: m.QuotaListDesktop,
    }))
);

export function QuotaContainer() {
  const viewModel = useQuotaViewModel();
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
