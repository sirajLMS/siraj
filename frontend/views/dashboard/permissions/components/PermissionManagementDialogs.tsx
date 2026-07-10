"use client";

import type { Permission, PermissionGroup, User } from "@/frontend/graphql/generated/gql/graphql-types";
import { resolveLocalizedString } from "@/frontend/lib/localized-string";
import type { LocalizedString } from "@/frontend/types/localized-string.types";
import { AssignGroupDialog } from "@/frontend/views/dashboard/permissions/components/AssignGroupDialog";
import { DeleteGroupDialog } from "@/frontend/views/dashboard/permissions/components/DeleteGroupDialog";
import { ManageOverridesDialog } from "@/frontend/views/dashboard/permissions/components/ManageOverridesDialog";
import { PermissionGroupForm } from "@/frontend/views/dashboard/permissions/components/PermissionGroupForm";

export interface PermissionManagementDialogsProps {
  readonly permissions: readonly Permission[];
  readonly groups: readonly PermissionGroup[];
  readonly users: readonly User[];
  readonly isLoading: boolean;
  readonly activeGroup: PermissionGroup | null;
  readonly selectedGroupId: string | null;
  readonly selectedUserIdForOverrides: string | null;
  readonly isCreateDialogOpen: boolean;
  readonly isEditDialogOpen: boolean;
  readonly isDeleteDialogOpen: boolean;
  readonly isAssignDialogOpen: boolean;
  readonly isManageOverridesOpen: boolean;
  readonly closeCreateDialog: () => void;
  readonly closeEditDialog: () => void;
  readonly closeDeleteDialog: () => void;
  readonly closeAssignDialog: () => void;
  readonly closeManageOverrides: () => void;
  readonly setSelectedUserIdForOverrides: (id: string | null) => void;
  readonly onCreateGroup: (
    name: LocalizedString,
    description: LocalizedString,
    permissionIds: string[]
  ) => Promise<void>;
  readonly onUpdateGroup: (
    id: string,
    name: LocalizedString,
    description: LocalizedString,
    permissionIds: string[]
  ) => Promise<void>;
  readonly onDeleteGroup: (id: string) => Promise<void>;
  readonly onAssignGroup: (groupId: string, userId: string) => Promise<void>;
  readonly onUpdateOverrides: (
    userId: string,
    overrides: Array<{ permissionId: string; state: string }>
  ) => Promise<void>;
}

export function PermissionManagementDialogs({
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
      <PermissionGroupForm
        open={isCreateDialogOpen}
        group={null}
        permissions={permissions}
        isLoading={isLoading}
        onClose={closeCreateDialog}
        onSave={onCreateGroup}
      />

      <PermissionGroupForm
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

      <DeleteGroupDialog
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

      <ManageOverridesDialog
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
