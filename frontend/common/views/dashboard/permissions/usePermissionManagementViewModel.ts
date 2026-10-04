"use client";

import {
  usePermissionManagementDataBindings,
  usePermissionManagementFormBindings,
  usePermissionManagementSubViewBindings,
} from "@/frontend/common/views/dashboard/permissions/usePermissionManagementViewModel.hooks";
import {
  usePermissionManagementStoreActions,
  usePermissionManagementStoreState,
} from "@/frontend/common/views/dashboard/permissions/usePermissionManagementViewModel.store";
import type {
  PermissionManagementDataBindings,
  PermissionManagementFormBindings,
  PermissionManagementStoreActions,
  PermissionManagementStoreState,
  PermissionManagementSubViewBindings,
} from "@/frontend/common/views/dashboard/permissions/usePermissionManagementViewModel.types";
import { type PermissionsLabels, Translation, useAppTranslation } from "@/shared/locale";

export interface PermissionManagementViewModel
  extends PermissionManagementStoreState,
    PermissionManagementStoreActions,
    PermissionManagementDataBindings,
    PermissionManagementFormBindings,
    PermissionManagementSubViewBindings {
  readonly labels: PermissionsLabels;
}

/**
 * ViewModel for the Permissions management domain.
 *
 * The Container instantiates it with no arguments; it sources its dependencies
 * from the `permissionManagementStore` selectors and from composed hooks
 * (queries/mutations, form state, catalog filter state, sub-view state and the
 * transient popover anchor). The returned flat object flows down through the
 * switcher into both tier views and their child components, which destructure
 * the fields and invoke callbacks without calling state hooks themselves.
 */
export function usePermissionManagementViewModel(): PermissionManagementViewModel {
  const labels = useAppTranslation(Translation.Dashboard.Permissions);
  const storeState = usePermissionManagementStoreState();
  const storeActions = usePermissionManagementStoreActions();
  const { isDataLoading, ...dataBindings } = usePermissionManagementDataBindings();

  const subViewBindings = usePermissionManagementSubViewBindings({
    permissions: storeState.permissions,
    groups: storeState.groups,
    users: dataBindings.users,
    selectedGroupId: storeState.selectedGroupId,
    selectedUserIdForOverrides: storeState.selectedUserIdForOverrides,
    isManageOverridesOpen: storeState.isManageOverridesOpen,
    isDataLoading,
    onRevokeGroup: dataBindings.onRevokeGroup,
    onBulkRevoke: dataBindings.onBulkRevoke,
    onUpdateGroup: dataBindings.onUpdateGroup,
    onUpdateOverrides: dataBindings.onUpdateOverrides,
    setSelectedUserIdForOverrides: storeActions.setSelectedUserIdForOverrides,
    closeManageOverrides: storeActions.closeManageOverrides,
  });

  const formBindings = usePermissionManagementFormBindings({
    permissions: storeState.permissions,
    isCreateDialogOpen: storeState.isCreateDialogOpen,
    isEditDialogOpen: storeState.isEditDialogOpen,
    isAssignDialogOpen: storeState.isAssignDialogOpen,
    activeGroup: subViewBindings.activeGroup,
    selectedGroupId: storeState.selectedGroupId,
    onCreateGroup: dataBindings.onCreateGroup,
    onUpdateGroup: dataBindings.onUpdateGroup,
  });

  return {
    labels,
    ...storeState,
    ...storeActions,
    ...dataBindings,
    ...formBindings,
    ...subViewBindings,
  };
}
