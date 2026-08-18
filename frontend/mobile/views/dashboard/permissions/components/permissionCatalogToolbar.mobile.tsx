"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, InputAdornment, TextField } from "@mui/material";
import type { PermissionCatalogToolbarProps } from "@/frontend/common/views/dashboard/permissions/types";
import { MobileContentInset, MobileHorizontalScrollRow } from "@/frontend/mobile/components/ui/container";

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
        transition: theme.transitions.create("all", { duration: 200 }),
      })}
    >
      {label}
    </Box>
  );
}

export function PermissionCatalogToolbarMobile({
  labels,
  searchQuery,
  selectedCategory,
  categories,
  onSearchChange,
  onCategoryChange,
}: Readonly<PermissionCatalogToolbarProps>) {
  const t = labels;

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
      <MobileContentInset>
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
      </MobileContentInset>

      <MobileHorizontalScrollRow sx={{ pb: 1 }}>
        <CategoryChip
          label={t.allCategories}
          active={selectedCategory === "all"}
          onClick={() => onCategoryChange("all")}
        />
        {categories.map(cat => (
          <CategoryChip key={cat} label={cat} active={selectedCategory === cat} onClick={() => onCategoryChange(cat)} />
        ))}
      </MobileHorizontalScrollRow>
    </Box>
  );
}
