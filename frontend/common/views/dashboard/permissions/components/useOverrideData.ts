import { useQuery } from "@apollo/client/react";
import { useEffect, useMemo, useState } from "react";
import type { Permission, PermissionGroup, User } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { userOverridesQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import type { OverrideState } from "@/frontend/common/views/dashboard/permissions/components/OverridesDataGrid";

interface UseOverrideDataParams {
  readonly userId: string | null;
  readonly users: readonly User[];
  readonly groups: readonly PermissionGroup[];
  readonly permissions: readonly Permission[];
  readonly open: boolean;
  readonly searchQuery: string;
}

export function useOverrideData({ userId, users, groups, permissions, open, searchQuery }: UseOverrideDataParams) {
  const [initialOverrides, setInitialOverrides] = useState<Record<string, OverrideState>>({});

  const user = useMemo(() => users.find(u => u.id === userId) || null, [users, userId]);

  const { data: queryData, loading: queryLoading } = useQuery(userOverridesQueryDocument, {
    variables: { userId: userId ?? "" },
    skip: !userId || !open,
  });

  const userGroups = useMemo(() => {
    if (!userId) return [];
    return groups.filter(g => g.assignedUsers?.some(au => au.id === userId));
  }, [groups, userId]);

  useEffect(() => {
    if (queryData?.userOverrides) {
      const overridesMap: Record<string, OverrideState> = {};
      for (const override of queryData.userOverrides) {
        if (override.permissionId) {
          overridesMap[override.permissionId] = override.state as OverrideState;
        }
      }
      setInitialOverrides(overridesMap);
    } else {
      setInitialOverrides({});
    }
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
