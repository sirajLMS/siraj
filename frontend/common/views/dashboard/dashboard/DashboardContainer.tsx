"use client";

import { DashboardContainerView } from "@/frontend/common/views/dashboard/dashboard/DashboardContainerView";
import {
  type UseDashboardContainerViewModelProps,
  useDashboardContainerViewModel,
} from "@/frontend/common/views/dashboard/dashboard/useDashboardContainerViewModel";

export function DashboardContainer(props: UseDashboardContainerViewModelProps) {
  const viewModel = useDashboardContainerViewModel(props);

  return <DashboardContainerView {...viewModel} />;
}
