"use client";

import type { ComponentType } from "react";
import { PermissionConfirmationDialogsShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionManagementDialogsShared.confirmationParts";
import { PermissionGroupFormDialogsShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionManagementDialogsShared.groupFormParts";
import type {
  AssignGroupDialogProps,
  DeleteGroupDialogProps,
  ManageOverridesDialogProps,
  PermissionGroupFormProps,
  PermissionManagementDialogsProps,
} from "@/frontend/common/views/dashboard/permissions/types";

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
      <PermissionGroupFormDialogsShared
        labels={labels}
        isLoading={isLoading}
        activeGroup={activeGroup}
        isCreateDialogOpen={isCreateDialogOpen}
        isEditDialogOpen={isEditDialogOpen}
        closeCreateDialog={closeCreateDialog}
        closeEditDialog={closeEditDialog}
        createGroupForm={createGroupForm}
        editGroupForm={editGroupForm}
        PermissionGroupForm={PermissionGroupForm}
      />

      <PermissionConfirmationDialogsShared
        labels={labels}
        isLoading={isLoading}
        activeGroup={activeGroup}
        selectedGroupId={selectedGroupId}
        isDeleteDialogOpen={isDeleteDialogOpen}
        isAssignDialogOpen={isAssignDialogOpen}
        isManageOverridesOpen={isManageOverridesOpen}
        closeDeleteDialog={closeDeleteDialog}
        closeAssignDialog={closeAssignDialog}
        closeManageOverrides={closeManageOverrides}
        setSelectedUserIdForOverrides={setSelectedUserIdForOverrides}
        onDeleteGroup={onDeleteGroup}
        onAssignGroup={onAssignGroup}
        assignGroupForm={assignGroupForm}
        manageOverridesState={manageOverridesState}
        DeleteGroupDialog={DeleteGroupDialog}
        AssignGroupDialog={AssignGroupDialog}
        ManageOverridesDialog={ManageOverridesDialog}
      />
    </>
  );
}
