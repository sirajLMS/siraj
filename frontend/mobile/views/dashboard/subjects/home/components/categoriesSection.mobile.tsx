"use client";

import { AddOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, Chip, IconButton, Stack } from "@mui/material";
import type { CategoriesSectionProps } from "@/frontend/common/views/dashboard/subjects/home/types";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container";
import { useAppTranslation } from "@/shared/locale";

/**
 * CategoriesSectionMobile — mobile-tier category management panel.
 *
 * Renders a horizontally-wrapping Chip list full-bleed so chips touch the
 * screen edge on narrow viewports (no inset padding around the chip row,
 * unlike the desktop variant which adds interior padding).
 */
export function CategoriesSectionMobile({
  categories,
  activeCategoryId,
  onCategoryChange,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory,
  canManage,
}: Readonly<CategoriesSectionProps>) {
  const t = useAppTranslation().dashboardTranslations.subjects;

  return (
    <MobileSectionPanel
      title={t.categoriesTitle}
      actions={
        canManage ? (
          <IconButton onClick={onCreateCategory} size="small" aria-label={t.createCategory}>
            <AddOutlined fontSize="small" />
          </IconButton>
        ) : undefined
      }
    >
      <Stack
        sx={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 1,
          px: 2,
          py: 2,
          width: "100%",
        }}
      >
        <Chip
          label={t.allCategories}
          variant={activeCategoryId === null ? "filled" : "outlined"}
          color={activeCategoryId === null ? "primary" : "default"}
          onClick={() => onCategoryChange(null)}
        />
        {categories.map(cat => (
          <Chip
            key={cat.id}
            label={cat.name}
            variant={activeCategoryId === cat.id ? "filled" : "outlined"}
            color={activeCategoryId === cat.id ? "primary" : "default"}
            onClick={() => onCategoryChange(cat.id ?? null)}
            onDelete={canManage ? () => onDeleteCategory(cat.id ?? "") : undefined}
            deleteIcon={
              canManage ? (
                <Box sx={{ display: "flex" }}>
                  <IconButton
                    size="small"
                    onClick={e => {
                      e.stopPropagation();
                      onEditCategory(cat.id ?? "");
                    }}
                    aria-label={t.editCategory}
                  >
                    <EditOutlined sx={{ fontSize: 14 }} />
                  </IconButton>
                  <DeleteOutlined sx={{ fontSize: 16 }} />
                </Box>
              ) : undefined
            }
          />
        ))}
      </Stack>
    </MobileSectionPanel>
  );
}
