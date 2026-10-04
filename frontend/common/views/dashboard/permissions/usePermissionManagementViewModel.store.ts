"use client";

import { usePermissionManagementStore } from "@/frontend/common/stores/permissionManagementStore";
import type {
  PermissionManagementStoreActions,
  PermissionManagementStoreState,
} from "@/frontend/common/views/dashboard/permissions/usePermissionManagementViewModel.types";

/**
 * Subscribes to the permissions store read slice with one selector per field so
 * each value only re-renders the ViewModel when its own field changes.
 */
export function usePermissionManagementStoreState(): PermissionManagementStoreState {
  return {
    error: usePermissionManagementStore(s => s.error),
    isLoading: usePermissionManagementStore(s => s.isLoading),
    permissions: usePermissionManagementStore(s => s.permissions),
    groups: usePermissionManagementStore(s => s.groups),
    overrides: usePermissionManagementStore(s => s.overrides),
    selectedGroupId: usePermissionManagementStore(s => s.selectedGroupId),
    selectedGroupIds: usePermissionManagementStore(s => s.selectedGroupIds),
    selectedUserIds: usePermissionManagementStore(s => s.selectedUserIds),
    selectedPermissionIds: usePermissionManagementStore(s => s.selectedPermissionIds),
    isCreateDialogOpen: usePermissionManagementStore(s => s.isCreateDialogOpen),
    isEditDialogOpen: usePermissionManagementStore(s => s.isEditDialogOpen),
    isDeleteDialogOpen: usePermissionManagementStore(s => s.isDeleteDialogOpen),
    isAssignDialogOpen: usePermissionManagementStore(s => s.isAssignDialogOpen),
    isBulkRemoveUsersOpen: usePermissionManagementStore(s => s.isBulkRemoveUsersOpen),
    isManageOverridesOpen: usePermissionManagementStore(s => s.isManageOverridesOpen),
    activeTab: usePermissionManagementStore(s => s.activeTab),
    selectedUserIdForOverrides: usePermissionManagementStore(s => s.selectedUserIdForOverrides),
  };
}

/**
 * Exposes the permissions store setters, dialog open/close actions and tab
 * actions as a flat slice consumed by the ViewModel.
 */
export function usePermissionManagementStoreActions(): PermissionManagementStoreActions {
  return {
    setSelectedGroupId: usePermissionManagementStore(s => s.setSelectedGroupId),
    setSelectedGroupIds: usePermissionManagementStore(s => s.setSelectedGroupIds),
    setSelectedUserIds: usePermissionManagementStore(s => s.setSelectedUserIds),
    setSelectedPermissionIds: usePermissionManagementStore(s => s.setSelectedPermissionIds),
    openCreateDialog: usePermissionManagementStore(s => s.openCreateDialog),
    closeCreateDialog: usePermissionManagementStore(s => s.closeCreateDialog),
    openEditDialog: usePermissionManagementStore(s => s.openEditDialog),
    closeEditDialog: usePermissionManagementStore(s => s.closeEditDialog),
    openDeleteDialog: usePermissionManagementStore(s => s.openDeleteDialog),
    closeDeleteDialog: usePermissionManagementStore(s => s.closeDeleteDialog),
    openAssignDialog: usePermissionManagementStore(s => s.openAssignDialog),
    closeAssignDialog: usePermissionManagementStore(s => s.closeAssignDialog),
    openBulkRemoveUsers: usePermissionManagementStore(s => s.openBulkRemoveUsers),
    closeBulkRemoveUsers: usePermissionManagementStore(s => s.closeBulkRemoveUsers),
    openManageOverrides: usePermissionManagementStore(s => s.openManageOverrides),
    closeManageOverrides: usePermissionManagementStore(s => s.closeManageOverrides),
    setActiveTab: usePermissionManagementStore(s => s.setActiveTab),
    setSelectedUserIdForOverrides: usePermissionManagementStore(s => s.setSelectedUserIdForOverrides),
  };
}
