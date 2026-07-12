"use client";

import { Box } from "@mui/material";
import { useMemo, useState } from "react";
import type { Permission, PermissionGroup } from "@/frontend/graphql/generated/gql/graphql-types";
import { PermissionCatalogCardList } from "@/frontend/views/dashboard/permissions/components/PermissionCatalogCardList";
import { PermissionCatalogToolbar } from "@/frontend/views/dashboard/permissions/components/PermissionCatalogToolbar";

export interface PermissionCatalogSectionMobileProps {
  readonly permissions: readonly Permission[];
  readonly groups: readonly PermissionGroup[];
  readonly loading?: boolean;
}

export function PermissionCatalogSectionMobile({ permissions, groups }: Readonly<PermissionCatalogSectionMobileProps>) {
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
      <PermissionCatalogToolbar
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        categories={categories}
        isMobile
        onSearchChange={setSearchQuery}
        onCategoryChange={setSelectedCategory}
      />
      <PermissionCatalogCardList permissions={filteredPermissions} groups={groups} />
    </Box>
  );
}
