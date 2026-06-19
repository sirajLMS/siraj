"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useEffect } from "react";
import type { Permission, PermissionGroup } from "@/frontend/graphql/generated/gql/graphql-types";
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
  const { data: permissionsData, loading: permissionsLoading, error: permissionsError } = useQuery(permissionsQueryDocument);
  const { data: groupsData, loading: groupsLoading, error: groupsError } = useQuery(permissionGroupsQueryDocument);
  const store = usePermissionManagementStore();

  useEffect(() => {
    if (permissionsData?.permissions) store.setPermissions(permissionsData.permissions as Permission[]);
  }, [permissionsData, store]);

  useEffect(() => {
    if (groupsData?.permissionGroups) store.setGroups(groupsData.permissionGroups as PermissionGroup[]);
  }, [groupsData, store]);

  useEffect(() => {
    store.setLoading(permissionsLoading || groupsLoading);
  }, [permissionsLoading, groupsLoading, store]);

  const queryError = permissionsError || groupsError;
  useEffect(() => {
    if (queryError) {
      logger.error("[PermissionManagement] Query error:", queryError);
      store.setError(queryError.message);
    } else {
      store.setError(null);
    }
  }, [queryError, store]);

  const mutationOptions = (label: string, refetch = true) => ({
    ...(refetch ? { refetchQueries: [{ query: permissionGroupsQueryDocument }] } : {}),
    onError: (err: Error) => {
      logger.error(`[PermissionManagement] ${label} error:`, err);
      store.setError(err.message);
    },
  });

  const [createGroupMutation] = useMutation(createPermissionGroupMutationDocument, mutationOptions("Create group"));
  const [updateGroupMutation] = useMutation(updatePermissionGroupMutationDocument, mutationOptions("Update group"));
  const [deleteGroupMutation] = useMutation(deletePermissionGroupMutationDocument, mutationOptions("Delete group"));
  const [assignGroupMutation] = useMutation(assignPermissionGroupToUserMutationDocument, mutationOptions("Assign group"));
  const [revokeGroupMutation] = useMutation(revokePermissionGroupFromUserMutationDocument, mutationOptions("Revoke group"));
  const [bulkAssignMutation] = useMutation(bulkAssignUsersToGroupMutationDocument, mutationOptions("Bulk assign"));
  const [bulkRevokeMutation] = useMutation(bulkRevokeUsersFromGroupMutationDocument, mutationOptions("Bulk revoke"));
  const [updateOverridesMutation] = useMutation(updateUserOverridesMutationDocument, mutationOptions("Update overrides", false));

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
    isLoading: permissionsLoading || groupsLoading || store.isLoading,
    handleCreateGroup: (name: string, description: string, permissionIds: string[]) =>
      run("handleCreateGroup", () => createGroupMutation({ variables: { input: { name, description, permissionIds } } }), store.closeCreateDialog),
    handleUpdateGroup: (id: string, name: string, description: string, permissionIds: string[]) =>
      run("handleUpdateGroup", () => updateGroupMutation({ variables: { input: { groupId: id, name, description, permissionIds } } }), store.closeEditDialog),
    handleDeleteGroup: (id: string) =>
      run("handleDeleteGroup", () => deleteGroupMutation({ variables: { groupId: id } }), store.closeDeleteDialog),
    handleAssignGroup: (groupId: string, userId: string) =>
      run("handleAssignGroup", () => assignGroupMutation({ variables: { input: { groupId, userId } } }), store.closeAssignDialog),
    handleRevokeGroup: (groupId: string, userId: string) =>
      run("handleRevokeGroup", () => revokeGroupMutation({ variables: { input: { groupId, userId } } })),
    handleBulkAssign: (groupId: string, userIds: string[]) =>
      run("handleBulkAssign", () => bulkAssignMutation({ variables: { groupId, userIds } })),
    handleBulkRevoke: (groupId: string, userIds: string[]) =>
      run("handleBulkRevoke", () => bulkRevokeMutation({ variables: { groupId, userIds } })),
    handleUpdateOverrides: (userId: string, overrides: Array<{ permissionId: string; state: string }>) =>
      run("handleUpdateOverrides", () => updateOverridesMutation({ variables: { userId, overrides } }), store.closeManageOverrides),
  };
}
