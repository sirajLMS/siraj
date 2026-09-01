"use client";

import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import type { PermissionCatalogToolbarProps } from "@/frontend/common/views/dashboard/permissions/types";

export function PermissionCatalogToolbarDesktop({
  labels,
  searchQuery,
  selectedCategory,
  categories,
  onSearchChange,
  onCategoryChange,
}: Readonly<PermissionCatalogToolbarProps>) {
  const t = labels;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Box sx={{ minWidth: 320 }}>
        <SearchBarField value={searchQuery} placeholder={t.searchPlaceholder} onChange={onSearchChange} />
      </Box>

      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>{t.columnCategory}</InputLabel>
        <Select value={selectedCategory} onChange={e => onCategoryChange(e.target.value)} label={t.columnCategory}>
          <MenuItem value="all">{t.allCategories}</MenuItem>
          {categories.map(cat => (
            <MenuItem key={cat} value={cat}>
              {cat}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
