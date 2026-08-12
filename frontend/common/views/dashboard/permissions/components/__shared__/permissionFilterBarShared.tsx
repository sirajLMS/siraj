"use client";

import { Search } from "@mui/icons-material";
import { Box, Input, InputAdornment, MenuItem, Select } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { standardInputSx } from "@/frontend/common/components/ui/form";
import type { PermissionFilterBarProps } from "@/frontend/common/views/dashboard/permissions/types";

export interface PermissionFilterBarSharedOptions {
  readonly filterContainerSx: SxProps<Theme>;
  readonly inputGroupSx: SxProps<Theme>;
  readonly selectedCountBadgeSx: SxProps<Theme>;
}

export function PermissionFilterBarShared({
  labels,
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  selectedCount,
  isLoading,
  options,
}: Readonly<PermissionFilterBarProps> & { readonly options: PermissionFilterBarSharedOptions }) {
  const t = labels;

  return (
    <Box sx={options.filterContainerSx}>
      <Box sx={options.inputGroupSx}>
        <Input
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={t.searchPermissionsPlaceholder}
          sx={standardInputSx}
          startAdornment={
            <InputAdornment position="start">
              <Search sx={theme => ({ color: theme.palette.text.secondary })} />
            </InputAdornment>
          }
          disabled={isLoading}
        />

        <Select
          value={selectedCategory}
          onChange={e => onCategoryChange(e.target.value)}
          displayEmpty
          variant="standard"
          sx={standardInputSx}
          disabled={isLoading}
        >
          <MenuItem value="ALL">{t.allCategoriesOption}</MenuItem>
          {categories.map(cat => (
            <MenuItem key={cat} value={cat}>
              {cat}
            </MenuItem>
          ))}
        </Select>
      </Box>

      <Box sx={options.selectedCountBadgeSx}>{t.itemsSelectedLabel(selectedCount)}</Box>
    </Box>
  );
}
