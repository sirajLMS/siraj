"use client";

import { createLazyView } from "@/frontend/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/components/ui/container/ResponsiveViewSwitch";
import {
  type RescheduleViewModel,
  type UseRescheduleViewModelProps,
  useRescheduleViewModel,
} from "@/frontend/views/dashboard/reschedule/home/useRescheduleViewModel";

export type { RescheduleViewModel, UseRescheduleViewModelProps };

const lazyViews = createLazyView<RescheduleViewModel>(
  () =>
    import("@/frontend/views/dashboard/reschedule/home/rescheduleView.mobile").then(m => ({
      default: m.RescheduleViewMobile,
    })),
  () =>
    import("@/frontend/views/dashboard/reschedule/home/rescheduleView.desktop").then(m => ({
      default: m.RescheduleViewDesktop,
    }))
);

export function RescheduleView(props: Readonly<UseRescheduleViewModelProps>) {
  const viewModel = useRescheduleViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
