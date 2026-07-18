"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, InputAdornment, TextField } from "@mui/material";
import type { PermissionCatalogToolbarProps } from "@/frontend/common/views/dashboard/permissions/types";
import { useAppTranslation } from "@/shared/locale";

interface CategoryChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function CategoryChip({ label, active, onClick }: Readonly<CategoryChipProps>) {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={theme => ({
        flexShrink: 0,
        cursor: "pointer",
        borderRadius: "9999px",
        px: 2,
        py: 0.75,
        typography: "labelMd",
        fontWeight: 500,
        backgroundColor: active ? theme.palette.primaryContainer : theme.palette.surfaceContainer,
        color: active ? theme.palette.onPrimaryContainer : theme.palette.onSurfaceVariant,
        border: `1px solid ${active ? theme.palette.primaryContainer : theme.palette.outlineVariant}`,
        transition: "all 0.2s",
      })}
    >
      {label}
    </Box>
  );
}

export function PermissionCatalogToolbarMobile({
  searchQuery,
  selectedCategory,
  categories,
  onSearchChange,
  onCategoryChange,
}: Readonly<PermissionCatalogToolbarProps>) {
  const t = useAppTranslation().dashboardTranslations.permissions;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "stretch",
        gap: 2,
      }}
    >
      <TextField
        size="small"
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        placeholder={t.searchPlaceholder}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined fontSize="small" />
              </InputAdornment>
            ),
          },
          htmlInput: { autoComplete: "off" },
        }}
        sx={{ minWidth: "100%" }}
      />

      <Box
        sx={{
          display: "flex",
          gap: 1,
          overflowX: "auto",
          pb: 1,
          "&::-webkit-scrollbar": { display: "none" },
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        <CategoryChip
          label={t.allCategories}
          active={selectedCategory === "all"}
          onClick={() => onCategoryChange("all")}
        />
        {categories.map(cat => (
          <CategoryChip key={cat} label={cat} active={selectedCategory === cat} onClick={() => onCategoryChange(cat)} />
        ))}
      </Box>
    </Box>
  );
}
