"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { useQuotaViewModel } from "@/frontend/common/views/dashboard/billing/quota/useQuotaViewModel";

const lazyViews = createLazyView<ReturnType<typeof useQuotaViewModel>>(
  () =>
    import("@/frontend/common/views/dashboard/billing/quota/components/QuotaListDesktop").then(m => ({
      default: m.QuotaListDesktop,
    })),
  () =>
    import("@/frontend/common/views/dashboard/billing/quota/components/QuotaListMobile").then(m => ({
      default: m.QuotaListMobile,
    }))
);

export function QuotaContainer() {
  const viewModel = useQuotaViewModel();
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
