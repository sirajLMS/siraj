"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, FormControl, InputAdornment, MenuItem, Select, TextField } from "@mui/material";
import { useTranslations } from "next-intl";

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
      sx={(theme) => ({
        flexShrink: 0,
        cursor: "pointer",
        borderRadius: "9999px",
        px: 2,
        py: 0.75,
        fontSize: "0.75rem",
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

export interface PermissionCatalogToolbarProps {
  readonly searchQuery: string;
  readonly selectedCategory: string;
  readonly categories: readonly string[];
  readonly isMobile: boolean;
  readonly onSearchChange: (value: string) => void;
  readonly onCategoryChange: (value: string) => void;
}

export function PermissionCatalogToolbar({
  searchQuery,
  selectedCategory,
  categories,
  isMobile,
  onSearchChange,
  onCategoryChange,
}: PermissionCatalogToolbarProps) {
  const t = useTranslations("dashboard.permissions");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between",
        alignItems: isMobile ? "stretch" : "center",
        gap: 2,
      }}
    >
      <TextField
        size="small"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={t("searchPlaceholder")}
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
        sx={{ minWidth: isMobile ? "100%" : 320 }}
      />

      {!isMobile && (
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <Select value={selectedCategory} onChange={(e) => onCategoryChange(e.target.value)} displayEmpty>
            <MenuItem value="all">{t("allCategories")}</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {isMobile && (
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
            label={t("allCategories")}
            active={selectedCategory === "all"}
            onClick={() => onCategoryChange("all")}
          />
          {categories.map((cat) => (
            <CategoryChip key={cat} label={cat} active={selectedCategory === cat} onClick={() => onCategoryChange(cat)} />
          ))}
        </Box>
      )}
    </Box>
  );
}
