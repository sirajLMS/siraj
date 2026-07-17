"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type PermissionManagementViewModel,
  type UsePermissionManagementViewModelProps,
  usePermissionManagementViewModel,
} from "@/frontend/common/views/dashboard/permissions/usePermissionManagementViewModel";

const lazyViews = createLazyView<PermissionManagementViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/permissions/permissionManagementView.mobile").then(m => ({
      default: m.PermissionManagementMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/permissions/permissionManagementView.desktop").then(m => ({
      default: m.PermissionManagementDesktopView,
    }))
);

export function PermissionManagementContainer() {
  const viewModel = usePermissionManagementViewModel({} as UsePermissionManagementViewModelProps);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
