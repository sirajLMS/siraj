"use client";

import { createLazyView } from "@/frontend/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/components/ui/container/ResponsiveViewSwitch";
import type { RescheduleTrackingViewProps } from "@/frontend/views/dashboard/reschedule/tracking/tracking.types";

const lazyViews = createLazyView<RescheduleTrackingViewProps>(
  () =>
    import("@/frontend/views/dashboard/reschedule/tracking/rescheduleTrackingView.mobile").then(m => ({
      default: m.RescheduleTrackingViewMobile,
    })),
  () =>
    import("@/frontend/views/dashboard/reschedule/tracking/rescheduleTrackingView.desktop").then(m => ({
      default: m.RescheduleTrackingViewDesktop,
    }))
);

export function RescheduleTrackingView(props: Readonly<RescheduleTrackingViewProps>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
