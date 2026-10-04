"use client";

import type { ComponentType } from "react";
import type {
  PermissionGroupFormProps,
  PermissionManagementDialogsProps,
} from "@/frontend/common/views/dashboard/permissions/types";
import type { PermissionsLabels } from "@/shared/locale";

type GroupFormSlotProps = Pick<
  PermissionManagementDialogsProps,
  "labels" | "isLoading" | "isCreateDialogOpen" | "isEditDialogOpen" | "closeCreateDialog" | "closeEditDialog"
> & {
  readonly activeGroup: PermissionGroupFormProps["group"];
  readonly createGroupForm: PermissionManagementDialogsProps["createGroupForm"];
  readonly editGroupForm: PermissionManagementDialogsProps["editGroupForm"];
  readonly PermissionGroupForm: ComponentType<Readonly<PermissionGroupFormProps>>;
};

function GroupFormDialogSlot({
  PermissionGroupForm,
  labels,
  open,
  group,
  isLoading,
  onClose,
  form,
}: {
  readonly PermissionGroupForm: ComponentType<Readonly<PermissionGroupFormProps>>;
  readonly labels: PermissionsLabels;
  readonly open: boolean;
  readonly group: PermissionGroupFormProps["group"];
  readonly isLoading: boolean;
  readonly onClose: () => void;
  readonly form: PermissionManagementDialogsProps["createGroupForm"];
}) {
  return (
    <PermissionGroupForm
      {...form}
      labels={labels}
      open={open}
      group={group}
      permissions={[]}
      isLoading={isLoading}
      onClose={onClose}
    />
  );
}

export function PermissionGroupFormDialogsShared({
  labels,
  isLoading,
  activeGroup,
  isCreateDialogOpen,
  isEditDialogOpen,
  closeCreateDialog,
  closeEditDialog,
  createGroupForm,
  editGroupForm,
  PermissionGroupForm,
}: GroupFormSlotProps) {
  return (
    <>
      <GroupFormDialogSlot
        PermissionGroupForm={PermissionGroupForm}
        labels={labels}
        open={isCreateDialogOpen}
        group={null}
        isLoading={isLoading}
        onClose={closeCreateDialog}
        form={createGroupForm}
      />
      <GroupFormDialogSlot
        PermissionGroupForm={PermissionGroupForm}
        labels={labels}
        open={isEditDialogOpen}
        group={activeGroup}
        isLoading={isLoading}
        onClose={closeEditDialog}
        form={editGroupForm}
      />
    </>
  );
}
