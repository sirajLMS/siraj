"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type {
  DashboardViewModel,
  UseDashboardViewModelProps,
  useDashboardViewModel,
} from "@/frontend/common/views/dashboard/dashboard/useDashboardViewModel";

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

export function DashboardView(viewModel: Readonly<DashboardViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
export type { DashboardViewModel, UseDashboardViewModelProps, useDashboardViewModel };
