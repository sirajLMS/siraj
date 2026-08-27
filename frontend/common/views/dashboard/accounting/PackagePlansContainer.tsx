"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { usePackagePlansListViewModel } from "@/frontend/common/views/dashboard/accounting/usePackagePlansListViewModel";

const lazyViews = createLazyView<ReturnType<typeof usePackagePlansListViewModel>>(
  () =>
    import("@/frontend/desktop/views/dashboard/accounting/PackagePlansListView.desktop").then(m => ({
      default: m.PackagePlansListDesktop,
    })),
  () =>
    import("@/frontend/mobile/views/dashboard/accounting/PackagePlansListView.mobile").then(m => ({
      default: m.PackagePlansListMobile,
    }))
);

export function PackagePlansContainer() {
  const viewModel = usePackagePlansListViewModel();
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
