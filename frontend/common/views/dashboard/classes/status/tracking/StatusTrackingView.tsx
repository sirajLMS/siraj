"use client";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type {
  StatusTrackingViewModel,
  UseStatusTrackingViewModelProps,
} from "@/frontend/common/views/dashboard/classes/status/tracking/useStatusTrackingViewModel";

const lazyViews = createLazyView<StatusTrackingViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/classes/status/tracking/statusTrackingView.mobile").then(m => ({
      default: m.StatusTrackingMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/classes/status/tracking/statusTrackingView.desktop").then(m => ({
      default: m.StatusTrackingDesktopView,
    }))
);

export function StatusTrackingView(props: Readonly<StatusTrackingViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
export type { StatusTrackingViewModel, UseStatusTrackingViewModelProps };
