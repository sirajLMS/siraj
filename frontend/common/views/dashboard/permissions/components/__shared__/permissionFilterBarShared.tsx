"use client";

import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
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
        <SearchBarField value={searchTerm} placeholder={t.searchPermissionsPlaceholder} onChange={onSearchChange} />

        <FormControl disabled={isLoading}>
          <InputLabel>{t.columnCategory}</InputLabel>
          <Select value={selectedCategory} onChange={e => onCategoryChange(e.target.value)} label={t.columnCategory}>
            <MenuItem value="ALL">{t.allCategoriesOption}</MenuItem>
            {categories.map(cat => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={options.selectedCountBadgeSx}>{t.itemsSelectedLabel(selectedCount)}</Box>
    </Box>
  );
}
