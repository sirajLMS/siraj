"use client";

import { usePermissionHandlers } from "@/frontend/common/views/dashboard/permissions/usePermissionManagementData.handlers";
import {
  usePermissionMutations,
  useRunMutation,
} from "@/frontend/common/views/dashboard/permissions/usePermissionManagementData.mutations";
import { usePermissionQueries } from "@/frontend/common/views/dashboard/permissions/usePermissionManagementData.queries";

export function usePermissionManagementData() {
  const { usersData, permissionsLoading, groupsLoading, usersLoading } = usePermissionQueries();
  const mutations = usePermissionMutations();
  const { run } = useRunMutation(mutations.store);
  const handlers = usePermissionHandlers(run, mutations);

  return {
    isLoading: permissionsLoading || groupsLoading || usersLoading || mutations.store.isLoading,
    users: usersData?.users ?? [],
    ...handlers,
  };
}
