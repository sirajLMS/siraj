"use client";

import { Box, useMediaQuery, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { SectionPanel } from "@/frontend/components/ui";
import type { Permission, PermissionGroup } from "@/frontend/graphql/generated/gql/graphql-types";
import { PermissionCatalogCardList } from "./PermissionCatalogCardList";
import { PermissionCatalogDataGrid } from "./PermissionCatalogDataGrid";
import { PermissionCatalogToolbar } from "./PermissionCatalogToolbar";

export interface PermissionCatalogSectionProps {
  readonly permissions: readonly Permission[];
  readonly groups: readonly PermissionGroup[];
}

export function PermissionCatalogSection({ permissions, groups }: Readonly<PermissionCatalogSectionProps>) {
  const t = useTranslations("dashboard.permissions");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = useMemo(() => {
    const cats = permissions
      .map((p) => p.category)
      .filter((c): c is string => typeof c === "string" && c.trim() !== "");
    return Array.from(new Set(cats));
  }, [permissions]);

  const filteredPermissions = useMemo(
    () =>
      permissions.filter((p) => {
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
    [permissions, searchQuery, selectedCategory],
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <PermissionCatalogToolbar
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        categories={categories}
        isMobile={isMobile}
        onSearchChange={setSearchQuery}
        onCategoryChange={setSelectedCategory}
      />
      {isMobile ? (
        <PermissionCatalogCardList permissions={filteredPermissions} groups={groups} />
      ) : (
        <SectionPanel title={t("catalogTab")}>
          <PermissionCatalogDataGrid permissions={filteredPermissions} groups={groups} />
        </SectionPanel>
      )}
    </Box>
  );
}
