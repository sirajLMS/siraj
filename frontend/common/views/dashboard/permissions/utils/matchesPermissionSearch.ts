import type { PermissionsQuery_permissions } from "@/frontend/common/graphql/generated/gql/graphql";

export function matchesPermissionSearch(
  permission: Readonly<PermissionsQuery_permissions>,
  searchQuery: string
): boolean {
  if (!searchQuery.trim()) return true;
  const q = searchQuery.toLowerCase();
  return (
    (permission.key?.toLowerCase().includes(q) ?? false) ||
    (permission.category?.toLowerCase().includes(q) ?? false) ||
    (permission.description?.toLowerCase().includes(q) ?? false)
  );
}
