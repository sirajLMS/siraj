"use client";

import { useViewport } from "@/frontend/common/hooks/useViewport";
import { usePermissionManagementStore } from "@/frontend/common/stores/permissionManagementStore";
import {
  type PermissionManagementViewProps,
  usePermissionManagementViewModel,
} from "@/frontend/common/views/dashboard/permissions/usePermissionManagementViewModel";
import { PermissionManagementDesktopView } from "@/frontend/desktop/views/dashboard/permissions/permissionManagementView.desktop";
import { PermissionManagementMobileView } from "@/frontend/mobile/views/dashboard/permissions/permissionManagementView.mobile";

export type { PermissionManagementViewProps };

export function PermissionManagementView(props: Readonly<PermissionManagementViewProps>) {
  const activeTab = usePermissionManagementStore(state => state.activeTab);
  const selectedUserIdForOverrides = usePermissionManagementStore(state => state.selectedUserIdForOverrides);
  const setActiveTab = usePermissionManagementStore(state => state.setActiveTab);
  const setSelectedUserIdForOverrides = usePermissionManagementStore(state => state.setSelectedUserIdForOverrides);

  const viewModel = usePermissionManagementViewModel({
    ...props,
    activeTab,
    selectedUserIdForOverrides,
    setActiveTab,
    setSelectedUserIdForOverrides,
  });

  const { isMobile } = useViewport();

  return isMobile ? (
    <PermissionManagementMobileView {...viewModel} />
  ) : (
    <PermissionManagementDesktopView {...viewModel} />
  );
}
