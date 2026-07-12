"use client";

import { useViewport } from "@/frontend/hooks/useViewport";
import { usePermissionManagementStore } from "@/frontend/stores/permissionManagementStore";
import { PermissionManagementDesktopView } from "@/frontend/views/dashboard/permissions/permissionManagementView.desktop";
import { PermissionManagementMobileView } from "@/frontend/views/dashboard/permissions/permissionManagementView.mobile";
import {
  type PermissionManagementViewProps,
  usePermissionManagementViewModel,
} from "@/frontend/views/dashboard/permissions/usePermissionManagementViewModel";

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
