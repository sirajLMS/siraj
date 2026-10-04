"use client";

import type { ComponentType } from "react";
import type {
  AssignGroupDialogProps,
  DeleteGroupDialogProps,
  ManageOverridesDialogProps,
  PermissionManagementDialogsProps,
} from "@/frontend/common/views/dashboard/permissions/types";
import { resolveLocalizedString } from "@/shared/lib/localized-string";

type ConfirmationDialogsSlotProps = Pick<
  PermissionManagementDialogsProps,
  | "labels"
  | "isLoading"
  | "activeGroup"
  | "selectedGroupId"
  | "isDeleteDialogOpen"
  | "isAssignDialogOpen"
  | "isManageOverridesOpen"
  | "closeDeleteDialog"
  | "closeAssignDialog"
  | "closeManageOverrides"
  | "setSelectedUserIdForOverrides"
  | "onDeleteGroup"
  | "onAssignGroup"
  | "assignGroupForm"
  | "manageOverridesState"
> & {
  readonly DeleteGroupDialog: ComponentType<Readonly<DeleteGroupDialogProps>>;
  readonly AssignGroupDialog: ComponentType<Readonly<AssignGroupDialogProps>>;
  readonly ManageOverridesDialog: ComponentType<Readonly<ManageOverridesDialogProps>>;
};

export function PermissionConfirmationDialogsShared({
  labels,
  isLoading,
  activeGroup,
  selectedGroupId,
  isDeleteDialogOpen,
  isAssignDialogOpen,
  isManageOverridesOpen,
  closeDeleteDialog,
  closeAssignDialog,
  closeManageOverrides,
  setSelectedUserIdForOverrides,
  onDeleteGroup,
  onAssignGroup,
  assignGroupForm,
  manageOverridesState,
  DeleteGroupDialog,
  AssignGroupDialog,
  ManageOverridesDialog,
}: ConfirmationDialogsSlotProps) {
  return (
    <>
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
