"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { StatusTrackingDataGridProps } from "@/frontend/views/dashboard/classes/status/tracking/types";

/**
 * Switcher for the Status Tracking data grid.
 *
 * This is the ONLY file in this domain that reads the viewport tier for the
 * data grid. It delegates rendering to either the mobile or desktop
 * tier-specific variant. The desktop view (`statusTrackingView.desktop.tsx`)
 * consumes this component with the same `StatusTrackingDataGridProps` interface.
 *
 * The mobile and desktop variants contain no viewport logic — they render
 * the actions column at a fixed width appropriate for their tier
 * (mobile: 80px compact, desktop: 200px with flex).
 */
const lazyViews = createLazyView<StatusTrackingDataGridProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/classes/status/tracking/statusTrackingDataGrid.mobile").then(m => ({
      default: m.StatusTrackingDataGridMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/classes/status/tracking/statusTrackingDataGrid.desktop").then(m => ({
      default: m.StatusTrackingDataGridDesktop,
    }))
);

export function StatusTrackingDataGrid(props: Readonly<StatusTrackingDataGridProps>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
