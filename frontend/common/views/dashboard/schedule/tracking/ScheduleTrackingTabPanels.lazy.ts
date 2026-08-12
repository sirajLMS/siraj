import { lazy } from "react";

export const LazyRescheduleTab = lazy(() =>
  import("@/frontend/common/views/dashboard/schedule/tracking/tabs/reschedule/RescheduleTab").then(m => ({
    default: m.RescheduleTab,
  }))
);

export const LazyStatusTab = lazy(() =>
  import("@/frontend/common/views/dashboard/schedule/tracking/tabs/status/StatusTab").then(m => ({
    default: m.StatusTab,
  }))
);

export const LazyAlertsTab = lazy(() =>
  import("@/frontend/common/views/dashboard/schedule/tracking/tabs/alerts/AlertsTab").then(m => ({
    default: m.AlertsTab,
  }))
);
