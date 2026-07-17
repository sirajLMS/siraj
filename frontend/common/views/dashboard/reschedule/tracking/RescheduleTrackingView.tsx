"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { RescheduleTrackingViewModel } from "./useRescheduleTrackingViewModel";

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

export function RescheduleTrackingView(props: Readonly<RescheduleTrackingViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}

export type { RescheduleTrackingViewModel };
