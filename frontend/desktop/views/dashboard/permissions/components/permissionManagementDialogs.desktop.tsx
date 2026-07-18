"use client";

import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import type { PermissionManagementDialogsProps } from "@/frontend/common/views/dashboard/permissions/types";
import { AssignGroupDialogDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/assignGroupDialog.desktop";
import { DeleteGroupDialogDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/deleteGroupDialog.desktop";
import { ManageOverridesDialogDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/manageOverridesDialog.desktop";
import { PermissionGroupFormDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/permissionGroupForm.desktop";

export function PermissionManagementDialogsDesktop({
  permissions,
  groups,
  users,
  isLoading,
  activeGroup,
  selectedGroupId,
  selectedUserIdForOverrides,
  isCreateDialogOpen,
  isEditDialogOpen,
  isDeleteDialogOpen,
  isAssignDialogOpen,
  isManageOverridesOpen,
  closeCreateDialog,
  closeEditDialog,
  closeDeleteDialog,
  closeAssignDialog,
  closeManageOverrides,
  setSelectedUserIdForOverrides,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAssignGroup,
  onUpdateOverrides,
}: Readonly<PermissionManagementDialogsProps>) {
  return (
    <>
      <PermissionGroupFormDesktop
        open={isCreateDialogOpen}
        group={null}
        permissions={permissions}
        isLoading={isLoading}
        onClose={closeCreateDialog}
        onSave={onCreateGroup}
      />

      <PermissionGroupFormDesktop
        open={isEditDialogOpen}
        group={activeGroup}
        permissions={permissions}
        isLoading={isLoading}
        onClose={closeEditDialog}
        onSave={async (name, description, permissionIds) => {
          if (selectedGroupId) {
            await onUpdateGroup(selectedGroupId, name, description, permissionIds);
          }
        }}
      />

      <DeleteGroupDialogDesktop
        open={isDeleteDialogOpen}
        groupName={activeGroup?.name ? resolveLocalizedString(activeGroup.name) : ""}
        isLoading={isLoading}
        onClose={closeDeleteDialog}
        onConfirm={async () => {
          if (selectedGroupId) {
            await onDeleteGroup(selectedGroupId);
          }
        }}
      />

      <AssignGroupDialogDesktop
        open={isAssignDialogOpen}
        group={activeGroup}
        users={users}
        isLoading={isLoading}
        onClose={closeAssignDialog}
        onAssign={async userId => {
          if (selectedGroupId) {
            await onAssignGroup(selectedGroupId, userId);
          }
        }}
      />

      <ManageOverridesDialogDesktop
        open={isManageOverridesOpen}
        userId={selectedUserIdForOverrides}
        users={users}
        groups={groups}
        permissions={permissions}
        isLoading={isLoading}
        onClose={() => {
          setSelectedUserIdForOverrides(null);
          closeManageOverrides();
        }}
        onSave={onUpdateOverrides}
      />
    </>
  );
}
