"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type DashboardViewModel,
  type UseDashboardViewModelProps,
  useDashboardViewModel,
} from "@/frontend/common/views/dashboard/dashboard/useDashboardViewModel";

export type { DashboardViewModel };

const lazyViews = createLazyView<DashboardViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/dashboard/dashboard.mobile").then(m => ({
      default: m.DashboardMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/dashboard/dashboard.desktop").then(m => ({
      default: m.DashboardDesktopView,
    }))
);

export function DashboardView(props: Readonly<UseDashboardViewModelProps>) {
  const viewModel = useDashboardViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
