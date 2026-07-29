"use client";

import { Box, CircularProgress } from "@mui/material";
import { type ComponentType, lazy, Suspense } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { useScheduleTrackingTabsStore } from "@/frontend/common/stores/scheduleTrackingTabsStore";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import type { ScheduleTrackingTabId } from "@/frontend/common/views/dashboard/schedule/tracking/tabs/types";

type ScheduleTrackingTabPanelsProps = {
  readonly activeTab: ScheduleTrackingTabId;
};

type TabPanelDefinition = {
  readonly id: ScheduleTrackingTabId;
  readonly permissions: (typeof PAGE_PERMISSIONS)[keyof typeof PAGE_PERMISSIONS];
  readonly Component: ComponentType;
};

const LazyRescheduleTab = lazy(() =>
  import("@/frontend/common/views/dashboard/schedule/tracking/tabs/reschedule/RescheduleTab").then(m => ({
    default: m.RescheduleTab,
  }))
);

const LazyStatusTab = lazy(() =>
  import("@/frontend/common/views/dashboard/schedule/tracking/tabs/status/StatusTab").then(m => ({
    default: m.StatusTab,
  }))
);

const LazyAlertsTab = lazy(() =>
  import("@/frontend/common/views/dashboard/schedule/tracking/tabs/alerts/AlertsTab").then(m => ({
    default: m.AlertsTab,
  }))
);

const TAB_PANELS: readonly TabPanelDefinition[] = [
  { id: "reschedule", permissions: PAGE_PERMISSIONS.scheduleTrackingReschedule, Component: LazyRescheduleTab },
  { id: "status", permissions: PAGE_PERMISSIONS.scheduleTrackingStatus, Component: LazyStatusTab },
  { id: "alerts", permissions: PAGE_PERMISSIONS.scheduleTrackingAlerts, Component: LazyAlertsTab },
];

function TabPanelFallback() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
      <CircularProgress size={28} />
    </Box>
  );
}

function getTabPanelSx(isActive: boolean) {
  if (isActive) {
    return {
      position: "relative" as const,
      width: "100%",
      visibility: "visible" as const,
      overflow: "visible" as const,
      pointerEvents: "auto" as const,
    };
  }

  return {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    visibility: "hidden" as const,
    height: 0,
    overflow: "hidden" as const,
    pointerEvents: "none" as const,
  };
}

export function ScheduleTrackingTabPanels({ activeTab }: Readonly<ScheduleTrackingTabPanelsProps>) {
  const visitedTabs = useScheduleTrackingTabsStore(state => state.visitedTabs);

  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      {TAB_PANELS.map(({ id, permissions, Component }) => {
        if (!visitedTabs[id]) {
          return null;
        }

        const isActive = activeTab === id;

        return (
          <Box
            key={id}
            role="tabpanel"
            id={`schedule-tracking-tabpanel-${id}`}
            aria-labelledby={`schedule-tracking-tab-${id}`}
            aria-hidden={!isActive}
            sx={getTabPanelSx(isActive)}
          >
            <RequirePermission permissions={permissions} fallback={null}>
              <Suspense fallback={<TabPanelFallback />}>
                <Component />
              </Suspense>
            </RequirePermission>
          </Box>
        );
      })}
    </Box>
  );
}
