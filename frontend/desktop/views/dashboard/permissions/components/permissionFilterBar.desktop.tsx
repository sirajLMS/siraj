"use client";

import { Search } from "@mui/icons-material";
import { Box, Input, InputAdornment, MenuItem, Select } from "@mui/material";
import { styled } from "@mui/material/styles";
import { standardInputSx } from "@/frontend/common/components/ui/form";
import type { PermissionFilterBarProps } from "@/frontend/common/views/dashboard/permissions/types";

const StyledFilterContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  gap: theme.spacing(2),
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(2),
  backgroundColor: theme.palette.surfaceContainerHigh,
  borderRadius: Number(theme.shape.borderRadius) * 2,
}));

const StyledInputGroup = styled(Box)(({ theme }) => ({
  display: "flex",
  flex: 1,
  gap: theme.spacing(2),
  width: "100%",
  flexDirection: "row",
}));

const StyledSelectedCountBadge = styled(Box)(({ theme }) => ({
  padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  backgroundColor: theme.palette.primaryContainer,
  color: theme.palette.onPrimaryContainer,
  fontWeight: 700,
}));

export function PermissionFilterBarDesktop({
  labels,
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  selectedCount,
  isLoading,
}: Readonly<PermissionFilterBarProps>) {
  const t = labels;

  return (
    <StyledFilterContainer>
      <StyledInputGroup>
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
      </StyledInputGroup>

      <StyledSelectedCountBadge>{t.itemsSelectedLabel(selectedCount)}</StyledSelectedCountBadge>
    </StyledFilterContainer>
  );
}
