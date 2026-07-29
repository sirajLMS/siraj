"use client";

import { Box } from "@mui/material";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { ScheduleTrackingPageChrome } from "@/frontend/common/views/dashboard/schedule/tracking/ScheduleTrackingPageChrome";
import { ScheduleTrackingTabPanels } from "@/frontend/common/views/dashboard/schedule/tracking/ScheduleTrackingTabPanels";
import type { ScheduleTrackingTabsViewModel } from "@/frontend/common/views/dashboard/schedule/tracking/tabs/useScheduleTrackingTabsViewModel";

const lazyShell = createLazyView<{ readonly children: React.ReactNode }>(
  () =>
    import("@/frontend/mobile/views/dashboard/schedule/tracking/scheduleTracking.mobile").then(m => ({
      default: m.ScheduleTrackingMobilePageShell,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/schedule/tracking/scheduleTracking.desktop").then(m => ({
      default: m.ScheduleTrackingDesktopPageShell,
    }))
);

export function ScheduleTrackingView(viewModel: Readonly<ScheduleTrackingTabsViewModel>) {
  return (
    <ResponsiveViewSwitch
      mobile={lazyShell.mobile}
      desktop={lazyShell.desktop}
      props={{
        children: (
          <>
            <ScheduleTrackingPageChrome {...viewModel} />
            <Box
              sx={{
                mt: { xs: 2, md: 3 },
                display: "flex",
                flexDirection: "column",
                gap: { xs: 2, md: 3 },
              }}
            >
              <ScheduleTrackingTabPanels activeTab={viewModel.activeTab} />
            </Box>
          </>
        ),
      }}
    />
  );
}
