"use client";

import { ScheduleTrackingView } from "@/frontend/common/views/dashboard/schedule/tracking/ScheduleTrackingView";
import { useScheduleTrackingTabsViewModel } from "@/frontend/common/views/dashboard/schedule/tracking/tabs/useScheduleTrackingTabsViewModel";

export function ScheduleTrackingPageContainer() {
  const viewModel = useScheduleTrackingTabsViewModel();

  return <ScheduleTrackingView {...viewModel} />;
}
