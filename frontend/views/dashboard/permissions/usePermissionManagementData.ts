"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useEffect } from "react";
import type { User } from "@/frontend/graphql/generated/gql/graphql-types";
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
import { logger } from "@/frontend/utils/logger";

export function usePermissionManagementData() {
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
  const store = usePermissionManagementStore();

  useEffect(() => {
    if (permissionsData?.permissions) setPermissions(permissionsData.permissions);
  }, [permissionsData, setPermissions]);

  useEffect(() => {
    if (groupsData?.permissionGroups) setGroups(groupsData.permissionGroups);
  }, [groupsData, setGroups]);

  useEffect(() => {
    setLoading(permissionsLoading || groupsLoading || usersLoading);
  }, [permissionsLoading, groupsLoading, usersLoading, setLoading]);

  const queryError = permissionsError || groupsError || usersError;
  useEffect(() => {
    if (queryError) {
      logger.error("[PermissionManagement] Query error:", queryError);
      setError(queryError.message);
    } else {
      setError(null);
    }
  }, [queryError, setError]);

  const mutationOptions = (label: string, refetch = true) => ({
    ...(refetch
      ? {
        refetchQueries: [
          { query: permissionGroupsQueryDocument },
          { query: usersQueryDocument },
        ],
      }
      : {}),
    onError: (err: Error) => {
      logger.error(`[PermissionManagement] ${label} error:`, err);
      store.setError(err.message);
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

  const run = async (label: string, fn: () => Promise<unknown>, onSuccess?: () => void) => {
    store.setError(null);
    try {
      await fn();
      onSuccess?.();
    } catch (e) {
      logger.error(`[PermissionManagement] ${label} catch error:`, e);
    }
  };

  return {
    isLoading: permissionsLoading || groupsLoading || usersLoading || store.isLoading,
    users: (usersData?.users || []) as User[],
    handleCreateGroup: (name: string, description: string, permissionIds: string[]) =>
      run(
        "handleCreateGroup",
        () => createGroupMutation({ variables: { input: { name, description, permissionIds } } }),
        store.closeCreateDialog
      ),
    handleUpdateGroup: (id: string, name: string, description: string, permissionIds: string[]) =>
      run(
        "handleUpdateGroup",
        () => updateGroupMutation({ variables: { input: { groupId: id, name, description, permissionIds } } }),
        store.closeEditDialog
      ),
    handleDeleteGroup: (id: string) =>
      run("handleDeleteGroup", () => deleteGroupMutation({ variables: { groupId: id } }), store.closeDeleteDialog),
    handleAssignGroup: (groupId: string, userId: string) =>
      run(
        "handleAssignGroup",
        () => assignGroupMutation({ variables: { input: { groupId, userId } } }),
        store.closeAssignDialog
      ),
    handleRevokeGroup: (groupId: string, userId: string) =>
      run("handleRevokeGroup", () => revokeGroupMutation({ variables: { input: { groupId, userId } } })),
    handleBulkAssign: (groupId: string, userIds: string[]) =>
      run("handleBulkAssign", () => bulkAssignMutation({ variables: { groupId, userIds } })),
    handleBulkRevoke: (groupId: string, userIds: string[]) =>
      run("handleBulkRevoke", () => bulkRevokeMutation({ variables: { groupId, userIds } })),
    handleUpdateOverrides: (userId: string, overrides: Array<{ permissionId: string; state: string }>) =>
      run(
        "handleUpdateOverrides",
        () => updateOverridesMutation({ variables: { userId, overrides } }),
        store.closeManageOverrides
      ),
  };
}
