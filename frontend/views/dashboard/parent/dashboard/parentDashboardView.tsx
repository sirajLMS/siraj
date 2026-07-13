"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type ParentDashboardViewModel,
  type UseParentDashboardViewModelProps,
  useParentDashboardViewModel,
} from "@/frontend/views/dashboard/parent/dashboard/useParentDashboardViewModel";

export type { ParentDashboardViewModel };

const lazyViews = createLazyView<ParentDashboardViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/parent/dashboard/parentDashboard.mobile").then(m => ({
      default: m.ParentDashboardMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/parent/dashboard/parentDashboard.desktop").then(m => ({
      default: m.ParentDashboardDesktopView,
    }))
);

export function ParentDashboardView(props: Readonly<UseParentDashboardViewModelProps>) {
  const viewModel = useParentDashboardViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
