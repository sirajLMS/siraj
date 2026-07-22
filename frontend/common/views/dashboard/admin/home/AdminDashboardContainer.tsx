"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { AdminDashboardView } from "@/frontend/common/views/dashboard/admin/home/AdminDashboardView";
import {
  type UseAdminDashboardViewModelProps,
  useAdminDashboardViewModel,
} from "@/frontend/common/views/dashboard/admin/home/useAdminDashboardViewModel";

export function AdminDashboardContainer(props: UseAdminDashboardViewModelProps) {
  const viewModel = useAdminDashboardViewModel(props);

  return (
    <RequirePermission permissions={[AppPermission.DashboardViewMetrics]} fallback={null}>
      <AdminDashboardView {...viewModel} />
    </RequirePermission>
  );
}
