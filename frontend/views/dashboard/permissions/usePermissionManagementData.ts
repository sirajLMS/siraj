"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useEffect } from "react";
import type { OverrideState, PermissionGroup, User } from "@/frontend/graphql/generated/gql/graphql-types";
import { usersQueryDocument } from "@/frontend/graphql/sharedDocuments/auth.documents";
import {
  assignPermissionGroupToUserMutationDocument,
  bulkAssignUsersToGroupMutationDocument,
  bulkRevokeUsersFromGroupMutationDocument,
  createPermissionGroupMutationDocument,
  deletePermissionGroupMutationDocument,
  permissionGroupsQueryDocument,
  permissionsQueryDocument,
  revokePermissionGroupFromUserMutationDocument,
  updatePermissionGroupMutationDocument,
  updateUserOverridesMutationDocument,
} from "@/frontend/graphql/sharedDocuments/permission-management.documents";
import { usePermissionManagementStore } from "@/frontend/stores/permissionManagementStore";
import type { LocalizedString } from "@/frontend/types/localized-string.types";
import { logger } from "@/frontend/utils/logger";

// Hook for handling queries
const usePermissionQueries = () => {
  const {
    data: permissionsData,
    loading: permissionsLoading,
    error: permissionsError,
  } = useQuery(permissionsQueryDocument);
  const { data: groupsData, loading: groupsLoading, error: groupsError } = useQuery(permissionGroupsQueryDocument);
  const { data: usersData, loading: usersLoading, error: usersError } = useQuery(usersQueryDocument);

  const setPermissions = usePermissionManagementStore(s => s.setPermissions);
  const setGroups = usePermissionManagementStore(s => s.setGroups);
  const setLoading = usePermissionManagementStore(s => s.setLoading);
  const setError = usePermissionManagementStore(s => s.setError);

  useEffect(() => {
    if (permissionsData?.permissions) setPermissions(permissionsData.permissions);
  }, [permissionsData, setPermissions]);

  useEffect(() => {
    if (groupsData?.permissionGroups) setGroups(groupsData.permissionGroups as PermissionGroup[]);
  }, [groupsData, setGroups]);

  useEffect(() => {
    setLoading(permissionsLoading || groupsLoading || usersLoading);
  }, [permissionsLoading, groupsLoading, usersLoading, setLoading]);

  const queryError = permissionsError || groupsError || usersError;
  useEffect(() => {
    if (queryError) {
      logger.error("[PermissionManagement] Query error:", queryError);
      setError("operationFailed");
    } else {
      setError(null);
    }
  }, [queryError, setError]);

  return {
    usersData,
    permissionsLoading,
    groupsLoading,
    usersLoading,
  };
};

// Hook for handling mutations
const usePermissionMutations = () => {
  const store = usePermissionManagementStore();

  const mutationOptions = (label: string, refetch = true) => ({
    ...(refetch
      ? {
          refetchQueries: [{ query: permissionGroupsQueryDocument }, { query: usersQueryDocument }],
        }
      : {}),
    onError: (err: Error) => {
      logger.error(`[PermissionManagement] ${label} error:`, err);
      store.setError("operationFailed");
    },
  });

  const [createGroupMutation] = useMutation(createPermissionGroupMutationDocument, mutationOptions("Create group"));
  const [updateGroupMutation] = useMutation(updatePermissionGroupMutationDocument, mutationOptions("Update group"));
  const [deleteGroupMutation] = useMutation(deletePermissionGroupMutationDocument, mutationOptions("Delete group"));
  const [assignGroupMutation] = useMutation(
    assignPermissionGroupToUserMutationDocument,
    mutationOptions("Assign group")
  );
  const [revokeGroupMutation] = useMutation(
    revokePermissionGroupFromUserMutationDocument,
    mutationOptions("Revoke group")
  );
  const [bulkAssignMutation] = useMutation(bulkAssignUsersToGroupMutationDocument, mutationOptions("Bulk assign"));
  const [bulkRevokeMutation] = useMutation(bulkRevokeUsersFromGroupMutationDocument, mutationOptions("Bulk revoke"));
  const [updateOverridesMutation] = useMutation(
    updateUserOverridesMutationDocument,
    mutationOptions("Update overrides", false)
  );

  return {
    createGroupMutation,
    updateGroupMutation,
    deleteGroupMutation,
    assignGroupMutation,
    revokeGroupMutation,
    bulkAssignMutation,
    bulkRevokeMutation,
    updateOverridesMutation,
    store,
  };
};

// Define a type for our store
interface PermissionManagementStore {
  setError: (error: string | null) => void;
  closeCreateDialog: () => void;
  closeEditDialog: () => void;
  closeDeleteDialog: () => void;
  closeAssignDialog: () => void;
  closeManageOverrides: () => void;
  isLoading: boolean;
}

// Hook for running mutations safely
const useRunMutation = (store: PermissionManagementStore) => {
  const run = async (label: string, fn: () => Promise<unknown>, onSuccess?: () => void) => {
    store.setError(null);
    try {
      await fn();
      onSuccess?.();
    } catch (e) {
      logger.error(`[PermissionManagement] ${label} catch error:`, e);
    }
  };

  return { run };
};

export function usePermissionManagementData() {
  const { usersData, permissionsLoading, groupsLoading, usersLoading } = usePermissionQueries();

  const {
    createGroupMutation,
    updateGroupMutation,
    deleteGroupMutation,
    assignGroupMutation,
    revokeGroupMutation,
    bulkAssignMutation,
    bulkRevokeMutation,
    updateOverridesMutation,
    store,
  } = usePermissionMutations();

  const { run } = useRunMutation(store);

  const handleCreateGroup = (name: LocalizedString, description: LocalizedString, permissionIds: string[]) =>
    run(
      "handleCreateGroup",
      () => createGroupMutation({ variables: { input: { name, description, permissionIds } } }),
      store.closeCreateDialog
    );

  const handleUpdateGroup = (
    id: string,
    name: LocalizedString,
    description: LocalizedString,
    permissionIds: string[]
  ) =>
    run(
      "handleUpdateGroup",
      () => updateGroupMutation({ variables: { input: { groupId: id, name, description, permissionIds } } }),
      store.closeEditDialog
    );

  const handleDeleteGroup = (id: string) =>
    run("handleDeleteGroup", () => deleteGroupMutation({ variables: { groupId: id } }), store.closeDeleteDialog);

  const handleAssignGroup = (groupId: string, userId: string) =>
    run(
      "handleAssignGroup",
      () => assignGroupMutation({ variables: { input: { groupId, userId } } }),
      store.closeAssignDialog
    );

  const handleRevokeGroup = (groupId: string, userId: string) =>
    run("handleRevokeGroup", () => revokeGroupMutation({ variables: { input: { groupId, userId } } }));

  const handleBulkAssign = (groupId: string, userIds: string[]) =>
    run("handleBulkAssign", () => bulkAssignMutation({ variables: { groupId, userIds } }));

  const handleBulkRevoke = (groupId: string, userIds: string[]) =>
    run("handleBulkRevoke", () => bulkRevokeMutation({ variables: { groupId, userIds } }));

  const handleUpdateOverrides = (userId: string, overrides: Array<{ permissionId: string; state: string }>) =>
    run(
      "handleUpdateOverrides",
      () =>
        updateOverridesMutation({
          variables: {
            userId,
            overrides: overrides as Array<{ permissionId: string; state: OverrideState }>,
          },
        }),
      store.closeManageOverrides
    );

  return {
    isLoading: permissionsLoading || groupsLoading || usersLoading || store.isLoading,
    users: (usersData?.users || []) as User[],
    handleCreateGroup,
    handleUpdateGroup,
    handleDeleteGroup,
    handleAssignGroup,
    handleRevokeGroup,
    handleBulkAssign,
    handleBulkRevoke,
    handleUpdateOverrides,
  };
}
