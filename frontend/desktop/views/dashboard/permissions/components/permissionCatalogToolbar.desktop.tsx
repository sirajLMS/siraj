"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, FormControl, InputAdornment, MenuItem, Select, TextField } from "@mui/material";
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
      <TextField
        size="small"
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        placeholder={t.searchPlaceholder}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined fontSize="small" />
              </InputAdornment>
            ),
          },
          htmlInput: { autoComplete: "off" },
        }}
        sx={{ minWidth: 320 }}
      />

      <FormControl size="small" sx={{ minWidth: 200 }}>
        <Select value={selectedCategory} onChange={e => onCategoryChange(e.target.value)} displayEmpty>
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
