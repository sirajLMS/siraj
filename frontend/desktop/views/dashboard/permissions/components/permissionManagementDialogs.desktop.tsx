"use client";

import { PermissionManagementDialogsShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionManagementDialogsShared";
import type { PermissionManagementDialogsProps } from "@/frontend/common/views/dashboard/permissions/types";
import { AssignGroupDialogDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/assignGroupDialog.desktop";
import { DeleteGroupDialogDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/deleteGroupDialog.desktop";
import { ManageOverridesDialogDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/manageOverridesDialog.desktop";
import { PermissionGroupFormDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/permissionGroupForm.desktop";

export function PermissionManagementDialogsDesktop(props: Readonly<PermissionManagementDialogsProps>) {
  return (
    <PermissionManagementDialogsShared
      {...props}
      slots={{
        PermissionGroupForm: PermissionGroupFormDesktop,
        DeleteGroupDialog: DeleteGroupDialogDesktop,
        AssignGroupDialog: AssignGroupDialogDesktop,
        ManageOverridesDialog: ManageOverridesDialogDesktop,
      }}
    />
  );
}
