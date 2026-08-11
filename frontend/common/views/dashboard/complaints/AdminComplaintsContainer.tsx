"use client";

import { AdminComplaintsView } from "@/frontend/common/views/dashboard/complaints/AdminComplaintsView";
import {
  type UseAdminComplaintsViewModelProps,
  useAdminComplaintsViewModel,
} from "@/frontend/common/views/dashboard/complaints/useAdminComplaintsViewModel";

export function AdminComplaintsContainer(props: UseAdminComplaintsViewModelProps) {
  const viewModel = useAdminComplaintsViewModel(props);

  return <AdminComplaintsView {...viewModel} />;
}
