"use client";

import { Box } from "@mui/material";
import type { PermissionCatalogSectionProps } from "@/frontend/common/views/dashboard/permissions/types";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { PermissionCatalogDataGridDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/permissionCatalogDataGrid.desktop";
import { PermissionCatalogToolbarDesktop } from "@/frontend/desktop/views/dashboard/permissions/components/permissionCatalogToolbar.desktop";

export function PermissionCatalogSectionDesktop({
  labels,
  groups,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
  filteredPermissions,
  loading = false,
}: Readonly<PermissionCatalogSectionProps>) {
  const t = labels;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <PermissionCatalogToolbarDesktop
        labels={labels}
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        categories={categories}
        onSearchChange={setSearchQuery}
        onCategoryChange={setSelectedCategory}
      />
      <DesktopSectionPanel contentPadding={false} title={t.catalogTab}>
        <PermissionCatalogDataGridDesktop
          labels={labels}
          permissions={filteredPermissions}
          groups={groups}
          loading={loading}
        />
      </DesktopSectionPanel>
    </Box>
  );
}
