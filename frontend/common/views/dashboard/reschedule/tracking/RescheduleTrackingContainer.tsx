"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  type RescheduleTrackingViewModel,
  type UseRescheduleTrackingViewModelProps,
  useRescheduleTrackingViewModel,
} from "@/frontend/common/views/dashboard/reschedule/tracking/useRescheduleTrackingViewModel";

const lazyViews = createLazyView<RescheduleTrackingViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/reschedule/tracking/rescheduleTrackingView.mobile").then(m => ({
      default: m.RescheduleTrackingViewMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/reschedule/tracking/rescheduleTrackingView.desktop").then(m => ({
      default: m.RescheduleTrackingViewDesktop,
    }))
);

export function RescheduleTrackingContainer(_props: Readonly<UseRescheduleTrackingViewModelProps>) {
  const viewModel = useRescheduleTrackingViewModel();
  return (
    <RequirePermission permissions={[AppPermission.SessionReschedule]}>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}

export type { RescheduleTrackingViewModel, UseRescheduleTrackingViewModelProps };
