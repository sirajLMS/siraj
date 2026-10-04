"use client";

import { useQuery } from "@apollo/client/react";
import { useEffect } from "react";
import {
  permissionGroupsQueryDocument,
  permissionsQueryDocument,
  usersQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { usePermissionManagementStore } from "@/frontend/common/stores/permissionManagementStore";
import { logger } from "@/frontend/common/utils/logger";
import { USERS_QUERY_VARIABLES } from "@/frontend/common/views/dashboard/permissions/usePermissionManagementData.helpers";

export const usePermissionQueries = () => {
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

  const queryError = permissionsError ?? groupsError ?? usersError;
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
