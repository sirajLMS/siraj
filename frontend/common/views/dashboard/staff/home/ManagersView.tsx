"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type ManagersViewModel,
  type UseManagersViewModelProps,
  useManagersViewModel,
} from "@/frontend/common/views/dashboard/staff/home/useManagersViewModel";

const lazyViews = createLazyView<ManagersViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/staff/home/managersView.mobile").then(m => ({
      default: m.ManagersViewMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/staff/home/managersView.desktop").then(m => ({
      default: m.ManagersViewDesktop,
    }))
);

export function ManagersView(props: Readonly<UseManagersViewModelProps>) {
  const viewModel = useManagersViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
export type { ManagersViewModel, UseManagersViewModelProps };
