"use client";

import { Box } from "@mui/material";
import { useMemo, useState } from "react";
import type { Permission, PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { PermissionCatalogDataGridDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/permissionCatalogDataGrid.desktop";
import { PermissionCatalogToolbarDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/permissionCatalogToolbar.desktop";
import { useAppTranslation } from "@/shared/locale";

export interface PermissionCatalogSectionDesktopProps {
  readonly permissions: readonly Permission[];
  readonly groups: readonly PermissionGroup[];
  readonly loading?: boolean;
}

export function PermissionCatalogSectionDesktop({
  permissions,
  groups,
  loading = false,
}: Readonly<PermissionCatalogSectionDesktopProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <PermissionCatalogToolbarDesktop
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        categories={categories}
        onSearchChange={setSearchQuery}
        onCategoryChange={setSelectedCategory}
      />
      <DesktopSectionPanel title={t.catalogTab}>
        <PermissionCatalogDataGridDesktop permissions={filteredPermissions} groups={groups} loading={loading} />
      </DesktopSectionPanel>
    </Box>
  );
}
