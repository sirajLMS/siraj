"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  type RecurringScheduleDetailViewModel,
  type UseRecurringScheduleDetailViewModelProps,
  useRecurringScheduleDetailViewModel,
} from "@/frontend/common/views/dashboard/classes/recurring/useRecurringScheduleDetailViewModel";

const lazyViews = createLazyView<RecurringScheduleDetailViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/classes/recurring/recurringScheduleDetailView.mobile").then(m => ({
      default: m.RecurringScheduleDetailMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/classes/recurring/recurringScheduleDetailView.desktop").then(m => ({
      default: m.RecurringScheduleDetailDesktopView,
    }))
);

export function RecurringScheduleDetailContainer(props: UseRecurringScheduleDetailViewModelProps) {
  const viewModel = useRecurringScheduleDetailViewModel(props);

  return (
    <RequirePermission permissions={[AppPermission.ScheduleViewAll]} fallback={null}>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}

export type { RecurringScheduleDetailViewModel, UseRecurringScheduleDetailViewModelProps };
