"use client";

import { SearchOutlined } from "@mui/icons-material";
import { InputAdornment, MenuItem, Select, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { PermissionsLabels } from "@/shared/locale";

const StyledFilterContainer = styled("div")(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: 8,
  backgroundColor: theme.palette.surfaceContainerLow ?? theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  alignItems: "center",
  justifyContent: "space-between",
  [theme.breakpoints.up("sm")]: {
    flexDirection: "row",
  },
}));

const StyledSearchField = styled(TextField)(({ theme }) => ({
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    width: 360,
  },
}));

const StyledCategorySelect = styled(Select<string>)(({ theme }) => ({
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    width: 200,
  },
}));

interface AddPermissionFilterBarProps {
  readonly searchQuery: string;
  readonly onSearchChange: (value: string) => void;
  readonly selectedCategory: string;
  readonly onCategoryChange: (value: string) => void;
  readonly addCategories: readonly string[];
  readonly t: PermissionsLabels;
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
    <StyledFilterContainer>
      {/* Search Field */}
      <StyledSearchField
        size="small"
        placeholder={t.searchPermissionsPlaceholder}
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
      />
      {/* Category Filter */}
      <StyledCategorySelect size="small" value={selectedCategory} onChange={e => onCategoryChange(e.target.value)}>
        <MenuItem value="all">{t.allCategoriesOption}</MenuItem>
        {addCategories.map(cat => (
          <MenuItem key={cat} value={cat}>
            {cat}
          </MenuItem>
        ))}
      </StyledCategorySelect>
    </StyledFilterContainer>
  );
}
