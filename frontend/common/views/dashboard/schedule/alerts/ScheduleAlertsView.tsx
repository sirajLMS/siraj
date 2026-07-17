"use client";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type ScheduleAlertsViewModel,
  type UseScheduleAlertsViewModelProps,
  useScheduleAlertsViewModel,
} from "@/frontend/common/views/dashboard/schedule/alerts/useScheduleAlertsViewModel";

const lazyViews = createLazyView<ScheduleAlertsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/schedule/alerts/scheduleAlertsView.mobile").then(m => ({
      default: m.ScheduleAlertsViewMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/schedule/alerts/scheduleAlertsView.desktop").then(m => ({
      default: m.ScheduleAlertsViewDesktop,
    }))
);

export function ScheduleAlertsView(_props: Readonly<UseScheduleAlertsViewModelProps>) {
  const viewModel = useScheduleAlertsViewModel();
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}

export type { ScheduleAlertsViewModel, UseScheduleAlertsViewModelProps };
