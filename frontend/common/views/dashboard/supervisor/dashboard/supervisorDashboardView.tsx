"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type SupervisorDashboardViewModel,
  type UseSupervisorDashboardViewModelProps,
  useSupervisorDashboardViewModel,
} from "@/frontend/common/views/dashboard/supervisor/dashboard/useSupervisorDashboardViewModel";

export type { SupervisorDashboardViewModel };

const lazyViews = createLazyView<SupervisorDashboardViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/supervisor/dashboard/supervisorDashboard.mobile").then(m => ({
      default: m.SupervisorDashboardMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/supervisor/dashboard/supervisorDashboard.desktop").then(m => ({
      default: m.SupervisorDashboardDesktopView,
    }))
);

export function SupervisorDashboardView(props: Readonly<UseSupervisorDashboardViewModelProps>) {
  const viewModel = useSupervisorDashboardViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
