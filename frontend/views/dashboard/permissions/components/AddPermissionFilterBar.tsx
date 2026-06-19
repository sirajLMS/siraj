"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, InputAdornment, MenuItem, Select, TextField } from "@mui/material";

interface AddPermissionFilterBarProps {
  readonly searchQuery: string;
  readonly onSearchChange: (value: string) => void;
  readonly selectedCategory: string;
  readonly onCategoryChange: (value: string) => void;
  readonly addCategories: readonly string[];
  readonly t: (key: string) => string;
}

export function AddPermissionFilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  addCategories,
  t,
}: Readonly<AddPermissionFilterBarProps>) {
  return (
    <Box
      sx={theme => ({
        p: 2,
        borderRadius: 2,
        bgcolor: theme.palette.surfaceContainerLow ?? theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
        alignItems: "center",
        justifyContent: "space-between",
      })}
    >
      <TextField
        size="small"
        placeholder={t("searchPermissionsPlaceholder")}
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
        sx={{ width: { xs: "100%", sm: 360 } }}
      />
      <Select
        size="small"
        value={selectedCategory}
        onChange={e => onCategoryChange(e.target.value)}
        sx={{ width: { xs: "100%", sm: 200 } }}
      >
        <MenuItem value="all">{t("allCategoriesOption")}</MenuItem>
        {addCategories.map(cat => (
          <MenuItem key={cat} value={cat}>
            {cat}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
}
