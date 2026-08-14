"use client";

import type { ComponentType } from "react";
import type {
  AssignGroupDialogProps,
  DeleteGroupDialogProps,
  ManageOverridesDialogProps,
  PermissionGroupFormProps,
  PermissionManagementDialogsProps,
} from "@/frontend/common/views/dashboard/permissions/types";
import { resolveLocalizedString } from "@/shared/lib/localized-string";

export interface PermissionManagementDialogsSharedSlots {
  readonly PermissionGroupForm: ComponentType<Readonly<PermissionGroupFormProps>>;
  readonly DeleteGroupDialog: ComponentType<Readonly<DeleteGroupDialogProps>>;
  readonly AssignGroupDialog: ComponentType<Readonly<AssignGroupDialogProps>>;
  readonly ManageOverridesDialog: ComponentType<Readonly<ManageOverridesDialogProps>>;
}

export function PermissionManagementDialogsShared({
  labels,
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
  slots,
}: Readonly<PermissionManagementDialogsProps> & { readonly slots: PermissionManagementDialogsSharedSlots }) {
  const { PermissionGroupForm, DeleteGroupDialog, AssignGroupDialog, ManageOverridesDialog } = slots;

  return (
    <>
      <PermissionGroupForm
        labels={labels}
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

      <PermissionGroupForm
        labels={labels}
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

      <DeleteGroupDialog
        labels={labels}
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

      <AssignGroupDialog
        labels={labels}
        open={isAssignDialogOpen}
        group={activeGroup}
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

      <ManageOverridesDialog
        labels={labels}
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
