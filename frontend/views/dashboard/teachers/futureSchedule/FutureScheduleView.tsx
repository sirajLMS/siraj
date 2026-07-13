"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { FutureScheduleViewProps } from "@/frontend/views/dashboard/teachers/futureSchedule/types";
import {
  type FutureScheduleViewModel,
  useFutureScheduleViewModel,
} from "@/frontend/views/dashboard/teachers/futureSchedule/useFutureScheduleViewModel";

const lazyViews = createLazyView<FutureScheduleViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/teachers/futureSchedule/futureScheduleView.mobile").then(m => ({
      default: m.FutureScheduleViewMobile,
    })),
  () =>
    import("@/frontend/views/dashboard/teachers/futureSchedule/futureScheduleView.desktop").then(m => ({
      default: m.FutureScheduleViewDesktop,
    }))
);

export function FutureScheduleView(props: Readonly<FutureScheduleViewProps>) {
  const viewModel = useFutureScheduleViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
