"use client";

import { resolveLocalizedString } from "@/frontend/common/lib/localized-string";
import type { PermissionManagementDialogsProps } from "@/frontend/common/views/dashboard/permissions/types";
import { AssignGroupDialogMobile } from "@/frontend/mobile/views/dashboard/permissions/components/assignGroupDialog.mobile";
import { DeleteGroupDialogMobile } from "@/frontend/mobile/views/dashboard/permissions/components/deleteGroupDialog.mobile";
import { ManageOverridesDialogMobile } from "@/frontend/mobile/views/dashboard/permissions/components/manageOverridesDialog.mobile";
import { PermissionGroupFormMobile } from "@/frontend/mobile/views/dashboard/permissions/components/permissionGroupForm.mobile";

export function PermissionManagementDialogsMobile({
  users,
  isLoading,
  activeGroup,
  selectedGroupId,
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
  onDeleteGroup,
  onAssignGroup,
  createGroupForm,
  editGroupForm,
  assignGroupForm,
  manageOverridesState,
}: Readonly<PermissionManagementDialogsProps>) {
  return (
    <>
      <PermissionGroupFormMobile
        open={isCreateDialogOpen}
        group={null}
        permissions={[]}
        isLoading={isLoading}
        onClose={closeCreateDialog}
        control={createGroupForm.control}
        handleSubmit={createGroupForm.handleSubmit}
        onSubmit={createGroupForm.onSubmit}
        selectedPermissionIds={createGroupForm.selectedPermissionIds}
        searchTerm={createGroupForm.searchTerm}
        setSearchTerm={createGroupForm.setSearchTerm}
        selectedCategory={createGroupForm.selectedCategory}
        setSelectedCategory={createGroupForm.setSelectedCategory}
        categories={createGroupForm.categories}
        groupedPermissions={createGroupForm.groupedPermissions}
        handleTogglePermission={createGroupForm.handleTogglePermission}
        handleSelectAllCategory={createGroupForm.handleSelectAllCategory}
        isGroupSelected={createGroupForm.isGroupSelected}
        isGroupIndeterminate={createGroupForm.isGroupIndeterminate}
        setValue={createGroupForm.setValue}
      />

      <PermissionGroupFormMobile
        open={isEditDialogOpen}
        group={activeGroup}
        permissions={[]}
        isLoading={isLoading}
        onClose={closeEditDialog}
        control={editGroupForm.control}
        handleSubmit={editGroupForm.handleSubmit}
        onSubmit={editGroupForm.onSubmit}
        selectedPermissionIds={editGroupForm.selectedPermissionIds}
        searchTerm={editGroupForm.searchTerm}
        setSearchTerm={editGroupForm.setSearchTerm}
        selectedCategory={editGroupForm.selectedCategory}
        setSelectedCategory={editGroupForm.setSelectedCategory}
        categories={editGroupForm.categories}
        groupedPermissions={editGroupForm.groupedPermissions}
        handleTogglePermission={editGroupForm.handleTogglePermission}
        handleSelectAllCategory={editGroupForm.handleSelectAllCategory}
        isGroupSelected={editGroupForm.isGroupSelected}
        isGroupIndeterminate={editGroupForm.isGroupIndeterminate}
        setValue={editGroupForm.setValue}
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
        control={assignGroupForm.control}
        errors={assignGroupForm.errors}
        handleSubmit={assignGroupForm.handleSubmit}
      />

      <ManageOverridesDialogMobile
        open={isManageOverridesOpen}
        onClose={() => {
          setSelectedUserIdForOverrides(null);
          closeManageOverrides();
        }}
        manageOverridesState={manageOverridesState}
      />
    </>
  );
}
