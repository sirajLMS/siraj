"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import { ScheduleTrackingView } from "@/frontend/common/views/dashboard/schedule/tracking/ScheduleTrackingView";
import { useScheduleTrackingTabsViewModel } from "@/frontend/common/views/dashboard/schedule/tracking/tabs/useScheduleTrackingTabsViewModel";

export function ScheduleTrackingPageContainer() {
  const viewModel = useScheduleTrackingTabsViewModel();

  return (
    <RequirePermission permissions={PAGE_PERMISSIONS.scheduleTrackingParent} fallback={null}>
      <ScheduleTrackingView {...viewModel} />
    </RequirePermission>
  );
}
