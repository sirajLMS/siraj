"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { AdminComplaintsView } from "@/frontend/common/views/dashboard/complaints/AdminComplaintsView";
import {
  type AdminComplaintsViewModel,
  type UseAdminComplaintsViewModelProps,
  useAdminComplaintsViewModel,
} from "@/frontend/common/views/dashboard/complaints/useAdminComplaintsViewModel";

export function AdminComplaintsContainer(props: UseAdminComplaintsViewModelProps) {
  const viewModel = useAdminComplaintsViewModel(props);

  return (
    <RequirePermission permissions={[AppPermission.ComplaintsRespond, AppPermission.ComplaintsList]} fallback={null}>
      <AdminComplaintsView {...viewModel} />
    </RequirePermission>
  );
}

export type { AdminComplaintsViewModel, UseAdminComplaintsViewModelProps };
