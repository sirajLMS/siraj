"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { ScheduleTrackingTabsViewModel } from "@/frontend/common/views/dashboard/schedule/tracking/tabs/useScheduleTrackingTabsViewModel";

const lazyChrome = createLazyView<ScheduleTrackingTabsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/schedule/tracking/scheduleTracking.mobile").then(m => ({
      default: m.ScheduleTrackingMobileChrome,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/schedule/tracking/scheduleTracking.desktop").then(m => ({
      default: m.ScheduleTrackingDesktopChrome,
    }))
);

export function ScheduleTrackingPageChrome(viewModel: Readonly<ScheduleTrackingTabsViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyChrome.mobile} desktop={lazyChrome.desktop} props={viewModel} />;
}
