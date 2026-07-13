"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { RescheduleTrackingViewProps } from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.types";

const lazyViews = createLazyView<RescheduleTrackingViewProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/reschedule/tracking/rescheduleTrackingView.mobile").then(m => ({
      default: m.RescheduleTrackingViewMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/reschedule/tracking/rescheduleTrackingView.desktop").then(m => ({
      default: m.RescheduleTrackingViewDesktop,
    }))
);

export function RescheduleTrackingView(props: Readonly<RescheduleTrackingViewProps>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
