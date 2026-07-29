"use client";

import { Box } from "@mui/material";
import type { PermissionCatalogSectionProps } from "@/frontend/common/views/dashboard/permissions/types";
import { PermissionCatalogCardListMobile } from "@/frontend/mobile/views/dashboard/permissions/components/permissionCatalogCardList.mobile";
import { PermissionCatalogToolbarMobile } from "@/frontend/mobile/views/dashboard/permissions/components/permissionCatalogToolbar.mobile";

export function PermissionCatalogSectionMobile({
  labels,
  groups,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
  filteredPermissions,
}: Readonly<PermissionCatalogSectionProps>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <PermissionCatalogToolbarMobile
        labels={labels}
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        categories={categories}
        onSearchChange={setSearchQuery}
        onCategoryChange={setSelectedCategory}
      />
      <PermissionCatalogCardListMobile labels={labels} permissions={filteredPermissions} groups={groups} />
    </Box>
  );
}
