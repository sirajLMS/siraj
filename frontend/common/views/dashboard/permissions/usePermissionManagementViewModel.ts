"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import type {
  Permission,
  PermissionGroup,
  User,
  UserOverride,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { usersQueryDocument } from "@/frontend/common/graphql/sharedDocuments/auth/auth.documents";
import {
  permissionGroupsQueryDocument,
  permissionsQueryDocument,
  userOverridesQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/permissions/permission-management.documents";
import type { PermissionManagementTab } from "@/frontend/common/stores/permissionManagementStore";
import type { LocalizedString } from "@/frontend/common/types/localized-string.types";
import { useAppTranslation } from "@/shared/locale";

export interface PermissionManagementViewModel {
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

  readonly activeGroup: PermissionGroup | null;
  readonly activeTab: PermissionManagementTab;
  readonly selectedUserIdForOverrides: string | null;
  readonly setActiveTab: (tab: PermissionManagementTab) => void;
  readonly setSelectedUserIdForOverrides: (id: string | null) => void;
}

export interface UsePermissionManagementViewModelProps {
  readonly selectedGroupId: string | null;
  readonly selectedGroupIds: readonly string[];
  readonly selectedUserIds: readonly string[];
  readonly selectedPermissionIds: readonly string[];
  readonly isCreateDialogOpen: boolean;
  readonly isEditDialogOpen: boolean;
  readonly isDeleteDialogOpen: boolean;
  readonly isAssignDialogOpen: boolean;
  readonly isBulkRemoveUsersOpen: boolean;
  readonly isManageOverridesOpen: boolean;
  readonly activeTab: PermissionManagementTab;
  readonly selectedUserIdForOverrides: string | null;
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
  readonly setActiveTab: (tab: PermissionManagementTab) => void;
  readonly setSelectedUserIdForOverrides: (id: string | null) => void;
}

function resolveActiveGroup(
  groups: readonly PermissionGroup[],
  selectedGroupId: string | null
): PermissionGroup | null {
  return groups.find(g => g.id === selectedGroupId) ?? null;
}

export function usePermissionManagementViewModel(
  props: UsePermissionManagementViewModelProps
): PermissionManagementViewModel {
  const t = useAppTranslation().dashboardTranslations.permissions;
  const [error, setError] = useState<string | null>(null);

  const {
    data: permissionsData,
    loading: permissionsLoading,
    error: permissionsError,
  } = useQuery(permissionsQueryDocument, { fetchPolicy: "cache-and-network" });

  const {
    data: groupsData,
    loading: groupsLoading,
    error: groupsError,
  } = useQuery(permissionGroupsQueryDocument, { fetchPolicy: "cache-and-network" });

  const {
    data: usersData,
    loading: usersLoading,
    error: usersError,
  } = useQuery(usersQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const loading = permissionsLoading || groupsLoading || usersLoading;

  if (permissionsError || groupsError || usersError) {
    setError(t.errors.operationFailed);
  }

  const groups = (groupsData?.permissionGroups ?? []) as PermissionGroup[];
  const permissions = (permissionsData?.permissions ?? []) as Permission[];
  const users = (usersData?.users ?? []) as User[];

  const { data: overridesData } = useQuery(userOverridesQueryDocument, {
    variables: { userId: props.selectedUserIdForOverrides ?? "" },
    skip: !props.selectedUserIdForOverrides,
    fetchPolicy: "cache-and-network",
  });

  const overrides = (overridesData?.userOverrides ?? []) as UserOverride[];

  const activeGroup = useMemo<PermissionGroup | null>(
    () => resolveActiveGroup(groups, props.selectedGroupId),
    [groups, props.selectedGroupId]
  );

  return {
    permissions,
    groups,
    overrides,
    users,
    selectedGroupId: props.selectedGroupId,
    selectedGroupIds: props.selectedGroupIds,
    selectedUserIds: props.selectedUserIds,
    selectedPermissionIds: props.selectedPermissionIds,
    isLoading: loading,
    error,
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
