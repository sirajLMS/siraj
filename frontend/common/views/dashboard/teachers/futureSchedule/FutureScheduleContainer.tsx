"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type FutureScheduleViewModel,
  type UseFutureScheduleViewModelProps,
  useFutureScheduleViewModel,
} from "@/frontend/common/views/dashboard/teachers/futureSchedule/useFutureScheduleViewModel";

const lazyViews = createLazyView<FutureScheduleViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/teachers/futureSchedule/futureScheduleView.mobile").then(m => ({
      default: m.FutureScheduleViewMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/teachers/futureSchedule/futureScheduleView.desktop").then(m => ({
      default: m.FutureScheduleViewDesktop,
    }))
);

export function FutureScheduleContainer(props: Readonly<UseFutureScheduleViewModelProps>) {
  const viewModel = useFutureScheduleViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}

export type { FutureScheduleViewModel, UseFutureScheduleViewModelProps };
