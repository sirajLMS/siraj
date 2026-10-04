"use client";

import { useEffect, useMemo } from "react";
import type {
  PermissionsQuery_permissions as Permission,
  PermissionGroupsQuery_permissionGroups as PermissionGroup,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  buildPermissionGroupInitialValues,
  type GroupedPermissions,
} from "@/frontend/common/views/dashboard/permissions/components/usePermissionGroupForm.helpers";
import type { PermissionGroupFormData } from "@/frontend/common/views/dashboard/permissions/schemas/permissionGroupSchema";
import type { ValidPermission } from "@/frontend/common/views/dashboard/permissions/types/validPermission.types";
import { Translation, useAppTranslation } from "@/shared/locale";

/**
 * Derives the category list and the search/category-filtered permission groups
 * rendered by the permission catalog.
 */
export function usePermissionFormFilters(
  permissions: readonly Permission[],
  searchTerm: string,
  selectedCategory: string
): GroupedPermissions {
  const t = useAppTranslation(Translation.Dashboard.Permissions);

  const validPermissions = useMemo(
    () => permissions.filter((p): p is ValidPermission => !!p.id && !!p.key && !!p.category),
    [permissions]
  );

  const categories = useMemo(() => {
    const cats = validPermissions.map(p => p.category).filter((c): c is string => c.trim() !== "");
    return Array.from(new Set(cats));
  }, [validPermissions]);

  const filteredPermissions = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return validPermissions.filter(perm => {
      const matchesSearch =
        perm.key.toLowerCase().includes(q) || (perm.description?.toLowerCase().includes(q) ?? false);
      const matchesCategory = selectedCategory === "ALL" || perm.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [validPermissions, searchTerm, selectedCategory]);

  const groupedPermissions = useMemo(
    () =>
      filteredPermissions.reduce<Record<string, ValidPermission[]>>((acc, perm) => {
        const cat = perm.category || t.allCategoriesOption;
        if (!acc[cat]) {
          acc[cat] = [];
        }
        acc[cat].push(perm);
        return acc;
      }, {}),
    [filteredPermissions, t]
  );

  return { categories, groupedPermissions };
}

/**
 * Resets the form whenever the dialog opens: values are re-derived from `group`
 * (edit mode) or fall back to empty defaults (create mode), and the filter
 * state is cleared.
 */
export function useDialogOpenReset({
  open,
  group,
  reset,
  setSearchTerm,
  setSelectedCategory,
}: {
  open: boolean;
  group: PermissionGroup | null;
  reset: (values: PermissionGroupFormData) => void;
  setSearchTerm: (term: string) => void;
  setSelectedCategory: (category: string) => void;
}) {
  useEffect(() => {
    if (!open) return;
    reset(buildPermissionGroupInitialValues(group));
    setSearchTerm("");
    setSelectedCategory("ALL");
  }, [open, group, reset, setSearchTerm, setSelectedCategory]);
}
