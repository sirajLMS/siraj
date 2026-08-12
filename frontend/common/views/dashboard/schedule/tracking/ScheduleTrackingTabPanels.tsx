"use client";

import { useScheduleTrackingTabsStore } from "@/frontend/common/stores/scheduleTrackingTabsStore";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import { createTabbedPanePanels } from "@/frontend/common/views/dashboard/lib/createTabbedPanePanels";
import {
  LazyAlertsTab,
  LazyRescheduleTab,
  LazyStatusTab,
} from "@/frontend/common/views/dashboard/schedule/tracking/ScheduleTrackingTabPanels.lazy";
import type { ScheduleTrackingTabId } from "@/frontend/common/views/dashboard/schedule/tracking/tabs/types";

export const ScheduleTrackingTabPanels = createTabbedPanePanels<ScheduleTrackingTabId>({
  useVisitedTabs: () => useScheduleTrackingTabsStore(state => state.visitedTabs),
  ariaIdPrefix: "schedule-tracking",
  panels: [
    { id: "reschedule", permissions: PAGE_PERMISSIONS.scheduleTrackingReschedule, Component: LazyRescheduleTab },
    { id: "status", permissions: PAGE_PERMISSIONS.scheduleTrackingStatus, Component: LazyStatusTab },
    { id: "alerts", permissions: PAGE_PERMISSIONS.scheduleTrackingAlerts, Component: LazyAlertsTab },
  ],
});
