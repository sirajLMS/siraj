"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, InputAdornment, MenuItem, Select } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { AddPermissionFilterBarProps } from "@/frontend/common/views/dashboard/permissions/types";

const StyledFilterContainer = styled("div")(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 8,
  backgroundColor: theme.palette.surfaceContainerLow ?? theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  alignItems: "stretch",
}));

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

const StyledCategoryWrapper = styled(Box)({
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: 4,
});

export function AddPermissionFilterBarMobile({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  addCategories,
  t,
}: Readonly<AddPermissionFilterBarProps>) {
  return (
    <StyledFilterContainer>
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
      <StyledCategoryWrapper>
        <Select size="small" value={selectedCategory} onChange={e => onCategoryChange(e.target.value)} fullWidth>
          <MenuItem value="all">{t.allCategoriesOption}</MenuItem>
          {addCategories.map(cat => (
            <MenuItem key={cat} value={cat}>
              {cat}
            </MenuItem>
          ))}
        </Select>
      </StyledCategoryWrapper>
    </StyledFilterContainer>
  );
}
