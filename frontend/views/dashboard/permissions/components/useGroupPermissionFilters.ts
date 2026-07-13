import { useMemo } from "react";
import type { Permission, PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";

interface UseGroupPermissionFiltersProps {
  readonly group: PermissionGroup;
  readonly permissions: readonly Permission[];
  readonly searchQuery: string;
  readonly selectedCategory: string;
}

export function useGroupPermissionFilters({
  group,
  permissions,
  searchQuery,
  selectedCategory,
}: UseGroupPermissionFiltersProps) {
  const groupPermissions = useMemo(() => {
    const ids = group.permissionIds ?? [];
    return permissions.filter(p => p.id && ids.includes(p.id));
  }, [permissions, group.permissionIds]);

  const addCategories = useMemo(() => {
    const available = permissions.filter(
      p => !(p.id && group.permissionIds?.includes(p.id)) && !(p.key && group.permissionIds?.includes(p.key))
    );
    const cats = available.map(p => p.category).filter((c): c is string => typeof c === "string" && c.trim() !== "");
    return Array.from(new Set(cats));
  }, [permissions, group.permissionIds]);

  const filteredAvailablePermissions = useMemo(() => {
    const ids = group.permissionIds ?? [];
    const available = permissions.filter(p => p.id && !ids.includes(p.id));

    return available.filter(p => {
      if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          (p.key?.toLowerCase().includes(q) ?? false) ||
          (p.category?.toLowerCase().includes(q) ?? false) ||
          (p.description?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [permissions, group.permissionIds, selectedCategory, searchQuery]);

  const filteredAssignedUsers = useMemo(() => {
    const assigned = group.assignedUsers ?? [];
    const query = searchQuery.trim().toLowerCase();

    if (!query) return assigned;

    return assigned.filter(
      u =>
        u.name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.id?.toLowerCase().includes(query)
    );
  }, [group.assignedUsers, searchQuery]);

  const permissionsCount = groupPermissions.length;
  const assignedUsersCount = group.assignedUsers?.length ?? 0;

  return {
    groupPermissions,
    addCategories,
    filteredAvailablePermissions,
    filteredAssignedUsers,
    permissionsCount,
    assignedUsersCount,
  };
}
