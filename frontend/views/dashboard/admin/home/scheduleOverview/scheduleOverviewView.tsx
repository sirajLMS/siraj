"use client";

import { createLazyView } from "@/frontend/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/components/ui/container/ResponsiveViewSwitch";
import {
  type ScheduleOverviewViewModel,
  type UseScheduleOverviewViewModelProps,
  useScheduleOverviewViewModel,
} from "@/frontend/views/dashboard/admin/home/scheduleOverview/useScheduleOverviewViewModel";

export type { ScheduleOverviewViewModel };

const lazyViews = createLazyView<ScheduleOverviewViewModel>(
  () =>
    import("@/frontend/views/dashboard/admin/home/scheduleOverview/mobile/scheduleOverview.mobile").then(m => ({
      default: m.ScheduleOverviewMobileView,
    })),
  () =>
    import("@/frontend/views/dashboard/admin/home/scheduleOverview/desktop/scheduleOverview.desktop").then(m => ({
      default: m.ScheduleOverviewDesktopView,
    }))
);

export function ScheduleOverviewView(props: Readonly<UseScheduleOverviewViewModelProps>) {
  const viewModel = useScheduleOverviewViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
