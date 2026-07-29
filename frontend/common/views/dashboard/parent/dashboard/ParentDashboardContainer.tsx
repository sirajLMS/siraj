"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ParentDashboardView } from "@/frontend/common/views/dashboard/parent/dashboard/ParentDashboardView";
import {
  type UseParentDashboardViewModelProps,
  useParentDashboardViewModel,
} from "@/frontend/common/views/dashboard/parent/dashboard/useParentDashboardViewModel";

export function ParentDashboardContainer(props: UseParentDashboardViewModelProps) {
  const viewModel = useParentDashboardViewModel(props);

  return (
    <RequirePermission permissions={[AppPermission.ScheduleViewFamily]} fallback={null}>
      <ParentDashboardView {...viewModel} />
    </RequirePermission>
  );
}
