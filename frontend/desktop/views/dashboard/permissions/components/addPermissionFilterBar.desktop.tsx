"use client";

import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import { AddPermissionFilterBarShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/addPermissionFilterBarShared";
import type { AddPermissionFilterBarProps } from "@/frontend/common/views/dashboard/permissions/types";

function DesktopSearchSlot({
  searchQuery,
  onSearchChange,
  t,
}: Readonly<Pick<AddPermissionFilterBarProps, "searchQuery" | "onSearchChange" | "t">>) {
  return (
    <Box sx={{ width: 360 }}>
      <SearchBarField value={searchQuery} placeholder={t.searchPermissionsPlaceholder} onChange={onSearchChange} />
    </Box>
  );
}

function DesktopCategorySlot({
  selectedCategory,
  onCategoryChange,
  addCategories,
  t,
}: Readonly<Pick<AddPermissionFilterBarProps, "selectedCategory" | "onCategoryChange" | "addCategories" | "t">>) {
  return (
    <FormControl size="small" sx={{ width: 200 }}>
      <InputLabel>{t.columnCategory}</InputLabel>
      <Select<string>
        value={selectedCategory}
        onChange={e => onCategoryChange(e.target.value)}
        label={t.columnCategory}
      >
        <MenuItem value="all">{t.allCategoriesOption}</MenuItem>
        {addCategories.map(cat => (
          <MenuItem key={cat} value={cat}>
            {cat}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export function AddPermissionFilterBarDesktop(props: Readonly<AddPermissionFilterBarProps>) {
  return (
    <AddPermissionFilterBarShared
      props={props}
      slots={{ SearchSlot: DesktopSearchSlot, CategorySlot: DesktopCategorySlot, variant: "desktop" }}
    />
  );
}
