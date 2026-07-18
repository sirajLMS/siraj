// NEW FOR PLAN v5 (newly created for the migration wave)
import { useMemo } from "react";
import type { Permission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { usePermissionManagementStore } from "@/frontend/common/stores/permissionManagementStore";

export interface PermissionCatalogFilterResult {
  readonly searchQuery: string;
  readonly setSearchQuery: (query: string) => void;
  readonly selectedCategory: string;
  readonly setSelectedCategory: (category: string) => void;
  readonly categories: string[];
  readonly filteredPermissions: Permission[];
}

/**
 * Common hook that owns the cross-tier search/category filter state for the
 * Permissions Catalog tab and derives `{ categories, filteredPermissions }`
 * from the input permission list.
 *
 * The state itself survives viewport tier switches because it is stored in
 * the `permissionManagementStore` (per specs §6.4 — common hook subscribes to
 * the Zustand store, tier views receive everything via props).
 *
 * Lifted out of `permissionCatalogSection.{mobile,desktop}.tsx` (Plan v5 NS-2
 * N7 + N11 lifts).
 */
export function usePermissionCatalogFilter(permissions: readonly Permission[]): PermissionCatalogFilterResult {
  const searchQuery = usePermissionManagementStore(s => s.permissionCatalogSearchQuery);
  const selectedCategory = usePermissionManagementStore(s => s.permissionCatalogSelectedCategory);
  const setSearchQuery = usePermissionManagementStore(s => s.setPermissionCatalogSearchQuery);
  const setSelectedCategory = usePermissionManagementStore(s => s.setPermissionCatalogSelectedCategory);

  const categories = useMemo(() => {
    const cats = permissions.map(p => p.category).filter((c): c is string => typeof c === "string" && c.trim() !== "");
    return Array.from(new Set(cats));
  }, [permissions]);

  const filteredPermissions = useMemo(
    () =>
      permissions.filter(p => {
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
      }),
    [permissions, searchQuery, selectedCategory]
  );

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredPermissions,
  };
}
