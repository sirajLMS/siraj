"use client";

import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import type { PermissionManagementDialogsProps } from "@/frontend/common/views/dashboard/permissions/types";
import { AssignGroupDialogMobile } from "@/frontend/mobile/views/dashboard/permissions/components/assignGroupDialog.mobile";
import { DeleteGroupDialogMobile } from "@/frontend/mobile/views/dashboard/permissions/components/deleteGroupDialog.mobile";
import { ManageOverridesDialogMobile } from "@/frontend/mobile/views/dashboard/permissions/components/manageOverridesDialog.mobile";
import { PermissionGroupFormMobile } from "@/frontend/mobile/views/dashboard/permissions/components/permissionGroupForm.mobile";

export function PermissionManagementDialogsMobile({
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
      <PermissionGroupFormMobile
        open={isCreateDialogOpen}
        group={null}
        permissions={permissions}
        isLoading={isLoading}
        onClose={closeCreateDialog}
        onSave={onCreateGroup}
      />

      <PermissionGroupFormMobile
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

      <DeleteGroupDialogMobile
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

      <AssignGroupDialogMobile
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

      <ManageOverridesDialogMobile
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
