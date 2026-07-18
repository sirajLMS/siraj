"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type SupervisorDashboardViewModel,
  useSupervisorDashboardViewModel,
} from "@/frontend/common/views/dashboard/supervisor/dashboard/useSupervisorDashboardViewModel";

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

export function SupervisorDashboardContainer() {
  const viewModel = useSupervisorDashboardViewModel({});
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}

export type { SupervisorDashboardViewModel };
