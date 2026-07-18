"use client";

import { Box } from "@mui/material";
import { useMemo, useState } from "react";
import type { PermissionCatalogSectionProps } from "@/frontend/common/views/dashboard/permissions/types";
import { PermissionCatalogCardListMobile } from "@/frontend/mobile/views/dashboard/permissions/components/permissionCatalogCardList.mobile";
import { PermissionCatalogToolbarMobile } from "@/frontend/mobile/views/dashboard/permissions/components/permissionCatalogToolbar.mobile";

export function PermissionCatalogSectionMobile({ permissions, groups }: Readonly<PermissionCatalogSectionProps>) {
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
      <PermissionCatalogToolbarMobile
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        categories={categories}
        onSearchChange={setSearchQuery}
        onCategoryChange={setSelectedCategory}
      />
      <PermissionCatalogCardListMobile permissions={filteredPermissions} groups={groups} />
    </Box>
  );
}
