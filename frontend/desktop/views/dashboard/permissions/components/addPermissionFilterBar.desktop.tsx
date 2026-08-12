"use client";

import { SearchOutlined } from "@mui/icons-material";
import { InputAdornment, MenuItem, Select, TextField } from "@mui/material";
import { AddPermissionFilterBarShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/addPermissionFilterBarShared";
import type { AddPermissionFilterBarProps } from "@/frontend/common/views/dashboard/permissions/types";

function DesktopSearchSlot({
  searchQuery,
  onSearchChange,
  t,
}: Readonly<Pick<AddPermissionFilterBarProps, "searchQuery" | "onSearchChange" | "t">>) {
  return (
    <TextField
      size="small"
      placeholder={t.searchPermissionsPlaceholder}
      value={searchQuery}
      onChange={e => onSearchChange(e.target.value)}
      sx={{ width: 360 }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchOutlined fontSize="small" />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

function DesktopCategorySlot({
  selectedCategory,
  onCategoryChange,
  addCategories,
  t,
}: Readonly<Pick<AddPermissionFilterBarProps, "selectedCategory" | "onCategoryChange" | "addCategories" | "t">>) {
  return (
    <Select<string>
      size="small"
      value={selectedCategory}
      onChange={e => onCategoryChange(e.target.value)}
      sx={{ width: 200 }}
    >
      <MenuItem value="all">{t.allCategoriesOption}</MenuItem>
      {addCategories.map(cat => (
        <MenuItem key={cat} value={cat}>
          {cat}
        </MenuItem>
      ))}
    </Select>
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
