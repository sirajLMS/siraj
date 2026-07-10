"use client";

import { usePermissionManagementStore } from "@/frontend/stores/permissionManagementStore";
import { PermissionManagementView } from "@/frontend/views/dashboard/permissions/PermissionManagementView";
import { usePermissionManagementData } from "@/frontend/views/dashboard/permissions/usePermissionManagementData";

export function PermissionManagementContainer() {
  const store = usePermissionManagementStore();
  const {
    isLoading,
    users,
    handleCreateGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleAssignGroup,
    handleRevokeGroup,
    handleBulkAssign,
    handleBulkRevoke,
    handleUpdateOverrides,
  } = usePermissionManagementData();

  return (
    <PermissionManagementView
      permissions={store.permissions}
      groups={store.groups}
      overrides={store.overrides}
      users={users}
      selectedGroupId={store.selectedGroupId}
      selectedGroupIds={store.selectedGroupIds}
      selectedUserIds={store.selectedUserIds}
      selectedPermissionIds={store.selectedPermissionIds}
      isLoading={isLoading}
      error={store.error}
      isCreateDialogOpen={store.isCreateDialogOpen}
      isEditDialogOpen={store.isEditDialogOpen}
      isDeleteDialogOpen={store.isDeleteDialogOpen}
      isAssignDialogOpen={store.isAssignDialogOpen}
      isBulkRemoveUsersOpen={store.isBulkRemoveUsersOpen}
      isManageOverridesOpen={store.isManageOverridesOpen}
      setSelectedGroupId={store.setSelectedGroupId}
      setSelectedGroupIds={store.setSelectedGroupIds}
      setSelectedUserIds={store.setSelectedUserIds}
      setSelectedPermissionIds={store.setSelectedPermissionIds}
      openCreateDialog={store.openCreateDialog}
      closeCreateDialog={store.closeCreateDialog}
      openEditDialog={store.openEditDialog}
      closeEditDialog={store.closeEditDialog}
      openDeleteDialog={store.openDeleteDialog}
      closeDeleteDialog={store.closeDeleteDialog}
      openAssignDialog={store.openAssignDialog}
      closeAssignDialog={store.closeAssignDialog}
      openBulkRemoveUsers={store.openBulkRemoveUsers}
      closeBulkRemoveUsers={store.closeBulkRemoveUsers}
      openManageOverrides={store.openManageOverrides}
      closeManageOverrides={store.closeManageOverrides}
      onCreateGroup={handleCreateGroup}
      onUpdateGroup={handleUpdateGroup}
      onDeleteGroup={handleDeleteGroup}
      onAssignGroup={handleAssignGroup}
      onRevokeGroup={handleRevokeGroup}
      onBulkAssign={handleBulkAssign}
      onBulkRevoke={handleBulkRevoke}
      onUpdateOverrides={handleUpdateOverrides}
    />
  );
}
