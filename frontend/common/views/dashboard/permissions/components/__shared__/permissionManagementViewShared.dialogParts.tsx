"use client";

import type { ReactNode } from "react";
import type {
  DialogContext,
  PermissionManagementViewSharedInput,
} from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionManagementViewShared.types";

export function buildDialogContext(props: PermissionManagementViewSharedInput): DialogContext {
  return {
    labels: props.labels,
    isLoading: props.isLoading,
    activeGroup: props.activeGroup,
    selectedGroupId: props.selectedGroupId,
    isCreateDialogOpen: props.isCreateDialogOpen,
    isEditDialogOpen: props.isEditDialogOpen,
    isDeleteDialogOpen: props.isDeleteDialogOpen,
    isAssignDialogOpen: props.isAssignDialogOpen,
    isManageOverridesOpen: props.isManageOverridesOpen,
    closeCreateDialog: props.closeCreateDialog,
    closeEditDialog: props.closeEditDialog,
    closeDeleteDialog: props.closeDeleteDialog,
    closeAssignDialog: props.closeAssignDialog,
    closeManageOverrides: props.closeManageOverrides,
    setSelectedUserIdForOverrides: props.setSelectedUserIdForOverrides,
    onDeleteGroup: props.onDeleteGroup,
    onAssignGroup: props.onAssignGroup,
    createGroupForm: props.createGroupForm,
    editGroupForm: props.editGroupForm,
    assignGroupForm: props.assignGroupForm,
    manageOverridesState: props.manageOverridesState,
    slots: props.slots,
  };
}

export function renderDialogs(ctx: DialogContext): ReactNode {
  const { PermissionManagementDialogs } = ctx.slots;
  return (
    <PermissionManagementDialogs
      labels={ctx.labels}
      isLoading={ctx.isLoading}
      activeGroup={ctx.activeGroup}
      selectedGroupId={ctx.selectedGroupId}
      isCreateDialogOpen={ctx.isCreateDialogOpen}
      isEditDialogOpen={ctx.isEditDialogOpen}
      isDeleteDialogOpen={ctx.isDeleteDialogOpen}
      isAssignDialogOpen={ctx.isAssignDialogOpen}
      isManageOverridesOpen={ctx.isManageOverridesOpen}
      closeCreateDialog={ctx.closeCreateDialog}
      closeEditDialog={ctx.closeEditDialog}
      closeDeleteDialog={ctx.closeDeleteDialog}
      closeAssignDialog={ctx.closeAssignDialog}
      closeManageOverrides={ctx.closeManageOverrides}
      setSelectedUserIdForOverrides={ctx.setSelectedUserIdForOverrides}
      onDeleteGroup={ctx.onDeleteGroup}
      onAssignGroup={ctx.onAssignGroup}
      createGroupForm={ctx.createGroupForm}
      editGroupForm={ctx.editGroupForm}
      assignGroupForm={ctx.assignGroupForm}
      manageOverridesState={ctx.manageOverridesState}
    />
  );
}
