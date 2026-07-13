"use client";

import { useViewport } from "@/frontend/common/hooks/useViewport";
import { usePermissionManagementStore } from "@/frontend/common/stores/permissionManagementStore";
import { PermissionManagementMobileView } from "@/frontend/mobile/views/dashboard/permissions/permissionManagementView.mobile";
import { PermissionManagementDesktopView } from "@/frontend/views/dashboard/permissions/permissionManagementView.desktop";
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
