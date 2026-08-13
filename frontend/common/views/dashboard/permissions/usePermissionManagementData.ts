"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useEffect } from "react";
import { OverrideState, type User } from "@/frontend/common/graphql/generated/gql/graphql-types";
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
  usersQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { usePermissionManagementStore } from "@/frontend/common/stores/permissionManagementStore";
import { logger } from "@/frontend/common/utils/logger";
import type { LocalizedString } from "@/shared/types";

const USERS_QUERY_VARIABLES = { search: null, limit: 50, offset: 0 };

const OVERRIDE_STATE_VALUES = new Set(Object.values(OverrideState) as readonly string[]);

function isOverrideState(value: string): value is OverrideState {
  return OVERRIDE_STATE_VALUES.has(value);
}

// Hook for handling queries
const usePermissionQueries = () => {
  const {
    data: permissionsData,
    loading: permissionsLoading,
    error: permissionsError,
  } = useQuery(permissionsQueryDocument);
  const { data: groupsData, loading: groupsLoading, error: groupsError } = useQuery(permissionGroupsQueryDocument);
  const {
    data: usersData,
    loading: usersLoading,
    error: usersError,
  } = useQuery(usersQueryDocument, {
    variables: USERS_QUERY_VARIABLES,
  });

  const setPermissions = usePermissionManagementStore(s => s.setPermissions);
  const setGroups = usePermissionManagementStore(s => s.setGroups);
  const setLoading = usePermissionManagementStore(s => s.setLoading);
  const setError = usePermissionManagementStore(s => s.setError);

  useEffect(() => {
    if (permissionsData?.permissions) setPermissions(permissionsData.permissions);
  }, [permissionsData, setPermissions]);

  useEffect(() => {
    if (groupsData?.permissionGroups) {
      setGroups(
        groupsData.permissionGroups.map(group => ({
          __typename: "PermissionGroup" as const,
          ...group,
          assignedUsers: null,
        }))
      );
    }
  }, [groupsData, setGroups]);

  useEffect(() => {
    setLoading(permissionsLoading || groupsLoading || usersLoading);
  }, [permissionsLoading, groupsLoading, usersLoading, setLoading]);

  const queryError = (permissionsError ?? groupsError) ?? usersError;
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
          refetchQueries: [
            { query: permissionGroupsQueryDocument },
            { query: usersQueryDocument, variables: USERS_QUERY_VARIABLES },
          ],
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

// Hook for building mutation handler functions
const usePermissionHandlers = (
  run: (label: string, fn: () => Promise<unknown>, onSuccess?: () => void) => Promise<void>,
  mutations: ReturnType<typeof usePermissionMutations>
) => {
  const {
    store,
    createGroupMutation,
    updateGroupMutation,
    deleteGroupMutation,
    assignGroupMutation,
    revokeGroupMutation,
    bulkAssignMutation,
    bulkRevokeMutation,
    updateOverridesMutation,
  } = mutations;

  return {
    handleCreateGroup: (name: LocalizedString, description: LocalizedString, permissionIds: string[]) =>
      run(
        "handleCreateGroup",
        () => createGroupMutation({ variables: { input: { name, description, permissionIds } } }),
        store.closeCreateDialog
      ),

    handleUpdateGroup: (id: string, name: LocalizedString, description: LocalizedString, permissionIds: string[]) =>
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
        () =>
          updateOverridesMutation({
            variables: {
              userId,
              overrides: overrides.map(({ permissionId, state }) => ({
                permissionId,
                state: isOverrideState(state) ? state : OverrideState.Granted,
              })),
            },
          }),
        store.closeManageOverrides
      ),
  };
};

export function usePermissionManagementData() {
  const { usersData, permissionsLoading, groupsLoading, usersLoading } = usePermissionQueries();
  const mutations = usePermissionMutations();
  const { run } = useRunMutation(mutations.store);
  const handlers = usePermissionHandlers(run, mutations);

  return {
    isLoading: permissionsLoading || groupsLoading || usersLoading || mutations.store.isLoading,
    users: (usersData?.users ?? []) as User[],
    ...handlers,
  };
}
