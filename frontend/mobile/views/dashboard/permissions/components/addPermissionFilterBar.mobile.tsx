"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, InputAdornment, MenuItem, Select, styled } from "@mui/material";
import { AddPermissionFilterBarShared } from "@/frontend/common/views/dashboard/permissions/components/__shared__/addPermissionFilterBarShared";
import type { AddPermissionFilterBarProps } from "@/frontend/common/views/dashboard/permissions/types";

const StyledSearchInput = styled("input")(({ theme }) => ({
  flex: 1,
  border: "none",
  outline: "none",
  background: "transparent",
  color: theme.palette.onSurface,
  fontFamily: theme.typography.bodyMd.fontFamily,
  fontSize: theme.typography.bodyMd.fontSize,
  padding: 0,
}));

function MobileSearchSlot({
  searchQuery,
  onSearchChange,
  t,
}: Readonly<Pick<AddPermissionFilterBarProps, "searchQuery" | "onSearchChange" | "t">>) {
  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      <InputAdornment
        position="start"
        sx={{ position: "absolute", left: 1, top: "50%", transform: "translateY(-50%)" }}
      >
        <SearchOutlined fontSize="small" />
      </InputAdornment>
      <StyledSearchInput
        type="text"
        placeholder={t.searchPermissionsPlaceholder}
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        style={{ paddingLeft: 36 }}
        autoComplete="off"
      />
    </Box>
  );
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
