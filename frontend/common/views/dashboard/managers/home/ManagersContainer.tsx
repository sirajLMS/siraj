"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  type ManagersContainerViewModel,
  type UseManagersContainerViewModelProps,
  useManagersContainerViewModel,
} from "@/frontend/common/views/dashboard/managers/home/useManagersContainerViewModel";

const lazyViews = createLazyView<ManagersContainerViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/managers/home/managersView.mobile").then(m => ({
      default: m.ManagersViewMobile,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/managers/home/managersView.desktop").then(m => ({
      default: m.ManagersViewDesktop,
    }))
);

export function ManagersContainer(props: UseManagersContainerViewModelProps) {
  const viewModel = useManagersContainerViewModel(props);

  return (
    <RequirePermission permissions={[AppPermission.StaffViewDirectory]} fallback={null}>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}

export type { ManagersContainerViewModel, UseManagersContainerViewModelProps };
