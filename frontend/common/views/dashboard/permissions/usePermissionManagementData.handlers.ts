"use client";

import { OverrideState } from "@/frontend/common/graphql/generated/gql/graphql";
import { isOverrideState } from "@/frontend/common/views/dashboard/permissions/usePermissionManagementData.helpers";
import type { usePermissionMutations } from "@/frontend/common/views/dashboard/permissions/usePermissionManagementData.mutations";
import type { LocalizedString } from "@/shared/types";

export const usePermissionHandlers = (
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
