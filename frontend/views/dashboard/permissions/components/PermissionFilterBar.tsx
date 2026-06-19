"use client";

import { Search } from "@mui/icons-material";
import { Box, Input, InputAdornment, MenuItem, Select } from "@mui/material";
import { useTranslations } from "next-intl";
import { standardInputSx } from "@/frontend/components/ui/form";

interface PermissionFilterBarProps {
  readonly searchTerm: string;
  readonly onSearchChange: (value: string) => void;
  readonly selectedCategory: string;
  readonly onCategoryChange: (value: string) => void;
  readonly categories: readonly string[];
  readonly selectedCount: number;
  readonly isLoading: boolean;
}

export function PermissionFilterBar({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  selectedCount,
  isLoading,
}: Readonly<PermissionFilterBarProps>) {
  const t = useTranslations("dashboard.permissions");

  return (
    <Box
      sx={theme => ({
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
        justifyContent: "space-between",
        alignItems: "center",
        p: 2,
        bgcolor: theme.palette.surfaceContainerHigh,
        borderRadius: 2,
      })}
    >
      <Box sx={{ display: "flex", flex: 1, gap: 2, width: "100%", flexDirection: { xs: "column", sm: "row" } }}>
        <Input
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={t("searchPermissionsPlaceholder")}
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
          <MenuItem value="ALL">{t("allCategoriesOption")}</MenuItem>
          {categories.map(cat => (
            <MenuItem key={cat} value={cat}>
              {cat}
            </MenuItem>
          ))}
        </Select>
      </Box>

      <Box
        sx={theme => ({
          px: 2,
          py: 1,
          borderRadius: 1.5,
          bgcolor: theme.palette.primaryContainer,
          color: theme.palette.onPrimaryContainer,
          fontWeight: 700,
        })}
      >
        {t("itemsSelectedLabel", { count: selectedCount })}
      </Box>
    </Box>
  );
}
