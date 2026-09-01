"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type RescheduleTrackingViewModel,
  type UseRescheduleTrackingViewModelProps,
  useRescheduleTrackingViewModel,
} from "@/frontend/common/views/dashboard/reschedule/tracking/useRescheduleTrackingViewModel";

const lazyViews = createLazyView<RescheduleTrackingViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/reschedule/tracking/rescheduleTrackingView.mobile").then(m => ({
      default: m.RescheduleTrackingViewMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/reschedule/tracking/rescheduleTrackingView.desktop").then(m => ({
      default: m.RescheduleTrackingViewDesktop,
    }))
);

export function RescheduleTrackingContainer(_props: Readonly<UseRescheduleTrackingViewModelProps>) {
  const viewModel = useRescheduleTrackingViewModel();
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}

export type { UseRescheduleTrackingViewModelProps };
