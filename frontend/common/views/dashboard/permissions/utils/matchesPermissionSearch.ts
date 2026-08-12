import type { Permission } from "@/frontend/common/graphql/generated/gql/graphql-types";

export function matchesPermissionSearch(permission: Readonly<Permission>, searchQuery: string): boolean {
  if (!searchQuery.trim()) return true;
  const q = searchQuery.toLowerCase();
  return (
    (permission.key?.toLowerCase().includes(q) ?? false) ||
    (permission.category?.toLowerCase().includes(q) ?? false) ||
    (permission.description?.toLowerCase().includes(q) ?? false)
  );
}
