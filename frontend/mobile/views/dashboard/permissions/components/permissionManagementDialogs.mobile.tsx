"use client";

import { PermissionManagementDialogsShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/permissionManagementDialogsShared";
import type { PermissionManagementDialogsProps } from "@/frontend/common/views/dashboard/permissions/types";
import { AssignGroupDialogMobile } from "@/frontend/mobile/views/dashboard/permissions/components/assignGroupDialog.mobile";
import { DeleteGroupDialogMobile } from "@/frontend/mobile/views/dashboard/permissions/components/deleteGroupDialog.mobile";
import { ManageOverridesDialogMobile } from "@/frontend/mobile/views/dashboard/permissions/components/manageOverridesDialog.mobile";
import { PermissionGroupFormMobile } from "@/frontend/mobile/views/dashboard/permissions/components/permissionGroupForm.mobile";

export function PermissionManagementDialogsMobile(props: Readonly<PermissionManagementDialogsProps>) {
  return (
    <PermissionManagementDialogsShared
      {...props}
      slots={{
        PermissionGroupForm: PermissionGroupFormMobile,
        DeleteGroupDialog: DeleteGroupDialogMobile,
        AssignGroupDialog: AssignGroupDialogMobile,
        ManageOverridesDialog: ManageOverridesDialogMobile,
      }}
    />
  );
}
