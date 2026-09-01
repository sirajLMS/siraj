"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type ManagersContainerViewModel,
  type UseManagersContainerViewModelProps,
  useManagersContainerViewModel,
} from "@/frontend/common/views/dashboard/staff/home/useManagersContainerViewModel";

const lazyViews = createLazyView<ManagersContainerViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/staff/home/managersView.mobile").then(m => ({
      default: m.ManagersViewMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/staff/home/managersView.desktop").then(m => ({
      default: m.ManagersViewDesktop,
    }))
);

export function ManagersContainer(props: UseManagersContainerViewModelProps) {
  const viewModel = useManagersContainerViewModel(props);

  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}

export type { UseManagersContainerViewModelProps };
