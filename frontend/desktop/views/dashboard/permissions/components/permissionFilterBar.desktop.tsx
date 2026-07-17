"use client";

import { Search } from "@mui/icons-material";
import { Box, Input, InputAdornment, MenuItem, Select } from "@mui/material";
import { styled } from "@mui/material/styles";
import { standardInputSx } from "@/frontend/common/components/ui/form";
import { useAppTranslation } from "@/shared/locale";

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

interface PermissionFilterBarDesktopProps {
  readonly searchTerm: string;
  readonly onSearchChange: (value: string) => void;
  readonly selectedCategory: string;
  readonly onCategoryChange: (value: string) => void;
  readonly categories: readonly string[];
  readonly selectedCount: number;
  readonly isLoading: boolean;
}

export function PermissionFilterBarDesktop({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  selectedCount,
  isLoading,
}: Readonly<PermissionFilterBarDesktopProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;

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
