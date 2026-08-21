import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import type {
  PermissionGroupDetailFieldsFragment,
  PermissionsQuery_permissions,
  UsersQuery_users,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { userOverridesQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import type { OverrideState } from "@/frontend/common/views/dashboard/permissions/components/overrideState.types";

const VALID_OVERRIDE_STATES: ReadonlySet<string> = new Set<string>(["GRANTED", "DENIED", "INHERIT"]);

function isOverrideState(value: unknown): value is OverrideState {
  return typeof value === "string" && VALID_OVERRIDE_STATES.has(value);
}

interface UseOverrideDataParams {
  readonly userId: string | null;
  readonly users: readonly UsersQuery_users[];
  readonly groups: readonly PermissionGroupDetailFieldsFragment[];
  readonly permissions: readonly PermissionsQuery_permissions[];
  readonly open: boolean;
  readonly searchQuery: string;
}

export function useOverrideData({ userId, users, groups, permissions, open, searchQuery }: UseOverrideDataParams) {
  const user = useMemo(() => users.find(u => u.id === userId) ?? null, [users, userId]);

  const { data: queryData, loading: queryLoading } = useQuery(userOverridesQueryDocument, {
    variables: { userId: userId ?? "" },
    skip: !userId || !open,
  });

  const userGroups = useMemo(() => {
    if (!userId) return [];
    return groups.filter(g => g.assignedUsers?.some(au => au.id === userId));
  }, [groups, userId]);

  const initialOverrides = useMemo<Record<string, OverrideState>>(() => {
    if (!queryData?.userOverrides) return {};
    const overridesMap: Record<string, OverrideState> = {};
    for (const override of queryData.userOverrides) {
      if (override.permissionId && isOverrideState(override.state)) {
        overridesMap[override.permissionId] = override.state;
      }
    }
    return overridesMap;
  }, [queryData]);

  const filteredPermissions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return permissions;

    return permissions.filter(
      p =>
        (p.key?.toLowerCase().includes(query) ?? false) ||
        (p.category?.toLowerCase().includes(query) ?? false) ||
        (p.description?.toLowerCase().includes(query) ?? false)
    );
  }, [permissions, searchQuery]);

  return {
    user,
    userGroups,
    filteredPermissions,
    queryLoading,
    initialOverrides,
  };
}
