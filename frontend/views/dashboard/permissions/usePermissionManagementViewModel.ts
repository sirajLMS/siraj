"use client";

import { useMemo } from "react";
import type { Permission, PermissionGroup, User, UserOverride } from "@/frontend/graphql/generated/gql/graphql-types";
import type { PermissionManagementTab } from "@/frontend/stores/permissionManagementStore";
import type { LocalizedString } from "@/frontend/types/localized-string.types";

export interface PermissionManagementViewProps {
  readonly permissions: readonly Permission[];
  readonly groups: readonly PermissionGroup[];
  readonly overrides: readonly UserOverride[];
  readonly users: readonly User[];
  readonly selectedGroupId: string | null;
  readonly selectedGroupIds: readonly string[];
  readonly selectedUserIds: readonly string[];
  readonly selectedPermissionIds: readonly string[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isCreateDialogOpen: boolean;
  readonly isEditDialogOpen: boolean;
  readonly isDeleteDialogOpen: boolean;
  readonly isAssignDialogOpen: boolean;
  readonly isBulkRemoveUsersOpen: boolean;
  readonly isManageOverridesOpen: boolean;

  readonly setSelectedGroupId: (id: string | null) => void;
  readonly setSelectedGroupIds: (ids: string[]) => void;
  readonly setSelectedUserIds: (ids: string[]) => void;
  readonly setSelectedPermissionIds: (ids: string[]) => void;

  readonly openCreateDialog: () => void;
  readonly closeCreateDialog: () => void;
  readonly openEditDialog: (id: string) => void;
  readonly closeEditDialog: () => void;
  readonly openDeleteDialog: (id: string) => void;
  readonly closeDeleteDialog: () => void;
  readonly openAssignDialog: (id: string) => void;
  readonly closeAssignDialog: () => void;
  readonly openBulkRemoveUsers: () => void;
  readonly closeBulkRemoveUsers: () => void;
  readonly openManageOverrides: () => void;
  readonly closeManageOverrides: () => void;

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
  readonly onRevokeGroup: (groupId: string, userId: string) => Promise<void>;
  readonly onBulkAssign: (groupId: string, userIds: string[]) => Promise<void>;
  readonly onBulkRevoke: (groupId: string, userIds: string[]) => Promise<void>;
  readonly onUpdateOverrides: (
    userId: string,
    overrides: Array<{ permissionId: string; state: string }>
  ) => Promise<void>;
}

export interface PermissionManagementViewModel extends PermissionManagementViewProps {
  readonly activeGroup: PermissionGroup | null;
  readonly activeTab: PermissionManagementTab;
  readonly selectedUserIdForOverrides: string | null;
  readonly setActiveTab: (tab: PermissionManagementTab) => void;
  readonly setSelectedUserIdForOverrides: (id: string | null) => void;
}

export type UsePermissionManagementViewModelProps = PermissionManagementViewProps & {
  readonly activeTab: PermissionManagementTab;
  readonly selectedUserIdForOverrides: string | null;
  readonly setActiveTab: (tab: PermissionManagementTab) => void;
  readonly setSelectedUserIdForOverrides: (id: string | null) => void;
};

function resolveActiveGroup(
  groups: readonly PermissionGroup[],
  selectedGroupId: string | null
): PermissionGroup | null {
  return groups.find(g => g.id === selectedGroupId) ?? null;
}

function buildViewModel(
  props: UsePermissionManagementViewModelProps,
  activeGroup: PermissionGroup | null
): PermissionManagementViewModel {
  return {
    permissions: props.permissions,
    groups: props.groups,
    overrides: props.overrides,
    users: props.users,
    selectedGroupId: props.selectedGroupId,
    selectedGroupIds: props.selectedGroupIds,
    selectedUserIds: props.selectedUserIds,
    selectedPermissionIds: props.selectedPermissionIds,
    isLoading: props.isLoading,
    error: props.error,
    isCreateDialogOpen: props.isCreateDialogOpen,
    isEditDialogOpen: props.isEditDialogOpen,
    isDeleteDialogOpen: props.isDeleteDialogOpen,
    isAssignDialogOpen: props.isAssignDialogOpen,
    isBulkRemoveUsersOpen: props.isBulkRemoveUsersOpen,
    isManageOverridesOpen: props.isManageOverridesOpen,
    setSelectedGroupId: props.setSelectedGroupId,
    setSelectedGroupIds: props.setSelectedGroupIds,
    setSelectedUserIds: props.setSelectedUserIds,
    setSelectedPermissionIds: props.setSelectedPermissionIds,
    openCreateDialog: props.openCreateDialog,
    closeCreateDialog: props.closeCreateDialog,
    openEditDialog: props.openEditDialog,
    closeEditDialog: props.closeEditDialog,
    openDeleteDialog: props.openDeleteDialog,
    closeDeleteDialog: props.closeDeleteDialog,
    openAssignDialog: props.openAssignDialog,
    closeAssignDialog: props.closeAssignDialog,
    openBulkRemoveUsers: props.openBulkRemoveUsers,
    closeBulkRemoveUsers: props.closeBulkRemoveUsers,
    openManageOverrides: props.openManageOverrides,
    closeManageOverrides: props.closeManageOverrides,
    onCreateGroup: props.onCreateGroup,
    onUpdateGroup: props.onUpdateGroup,
    onDeleteGroup: props.onDeleteGroup,
    onAssignGroup: props.onAssignGroup,
    onRevokeGroup: props.onRevokeGroup,
    onBulkAssign: props.onBulkAssign,
    onBulkRevoke: props.onBulkRevoke,
    onUpdateOverrides: props.onUpdateOverrides,
    activeGroup,
    activeTab: props.activeTab,
    selectedUserIdForOverrides: props.selectedUserIdForOverrides,
    setActiveTab: props.setActiveTab,
    setSelectedUserIdForOverrides: props.setSelectedUserIdForOverrides,
  };
}

export function usePermissionManagementViewModel(
  props: UsePermissionManagementViewModelProps
): PermissionManagementViewModel {
  const activeGroup = useMemo<PermissionGroup | null>(
    () => resolveActiveGroup(props.groups, props.selectedGroupId),
    [props.groups, props.selectedGroupId]
  );

  return buildViewModel(props, activeGroup);
}
