"use client";

import { useMutation } from "@apollo/client/react";
import {
  assignPermissionGroupToUserMutationDocument,
  bulkAssignUsersToGroupMutationDocument,
  bulkRevokeUsersFromGroupMutationDocument,
  createPermissionGroupMutationDocument,
  deletePermissionGroupMutationDocument,
  permissionGroupsQueryDocument,
  revokePermissionGroupFromUserMutationDocument,
  updatePermissionGroupMutationDocument,
  updateUserOverridesMutationDocument,
  usersQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { usePermissionManagementStore } from "@/frontend/common/stores/permissionManagementStore";
import { logger } from "@/frontend/common/utils/logger";
import { USERS_QUERY_VARIABLES } from "@/frontend/common/views/dashboard/permissions/usePermissionManagementData.helpers";

export interface PermissionManagementStore {
  setError: (error: string | null) => void;
  closeCreateDialog: () => void;
  closeEditDialog: () => void;
  closeDeleteDialog: () => void;
  closeAssignDialog: () => void;
  closeManageOverrides: () => void;
  isLoading: boolean;
}

export const useRunMutation = (store: PermissionManagementStore) => {
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

export const usePermissionMutations = () => {
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
