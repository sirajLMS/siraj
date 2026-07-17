"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  type StatusTrackingViewModel,
  type UseStatusTrackingViewModelProps,
  useStatusTrackingViewModel,
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

export function StatusTrackingContainer(props: UseStatusTrackingViewModelProps) {
  const viewModel = useStatusTrackingViewModel(props);

  return (
    <RequirePermission
      permissions={[AppPermission.ScheduleViewAll, AppPermission.DashboardViewMetrics]}
      fallback={null}
    >
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}

export type { StatusTrackingViewModel, UseStatusTrackingViewModelProps };
