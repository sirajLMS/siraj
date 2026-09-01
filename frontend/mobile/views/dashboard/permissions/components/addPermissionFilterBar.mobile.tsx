"use client";

import { MenuItem, Select } from "@mui/material";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import { AddPermissionFilterBarShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/addPermissionFilterBarShared";
import type { AddPermissionFilterBarProps } from "@/frontend/common/views/dashboard/permissions/types";

function MobileSearchSlot({
  searchQuery,
  onSearchChange,
  t,
}: Readonly<Pick<AddPermissionFilterBarProps, "searchQuery" | "onSearchChange" | "t">>) {
  return <SearchBarField value={searchQuery} placeholder={t.searchPermissionsPlaceholder} onChange={onSearchChange} />;
}

function MobileCategorySlot({
  selectedCategory,
  onCategoryChange,
  addCategories,
  t,
}: Readonly<Pick<AddPermissionFilterBarProps, "selectedCategory" | "onCategoryChange" | "addCategories" | "t">>) {
  return (
    <Select size="small" value={selectedCategory} onChange={e => onCategoryChange(e.target.value)} fullWidth>
      <MenuItem value="all">{t.allCategoriesOption}</MenuItem>
      {addCategories.map(cat => (
        <MenuItem key={cat} value={cat}>
          {cat}
        </MenuItem>
      ))}
    </Select>
  );
}

export function AddPermissionFilterBarMobile(props: Readonly<AddPermissionFilterBarProps>) {
  return (
    <AddPermissionFilterBarShared
      props={props}
      slots={{ SearchSlot: MobileSearchSlot, CategorySlot: MobileCategorySlot, variant: "mobile" }}
    />
  );
}
