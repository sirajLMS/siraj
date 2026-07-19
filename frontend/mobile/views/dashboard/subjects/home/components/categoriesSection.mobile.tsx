"use client";

import { AddOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, Chip, IconButton } from "@mui/material";
import type { CategoriesSectionProps } from "@/frontend/common/views/dashboard/subjects/home/types";
import { MobileHorizontalScrollRow, MobileSectionPanel } from "@/frontend/mobile/components/ui/container";
import { useAppTranslation } from "@/shared/locale";

/**
 * CategoriesSectionMobile — mobile-tier category filter strip.
 * Horizontal scroll row so chips stay on one swipeable line.
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
      <MobileHorizontalScrollRow sx={{ py: 2 }}>
        <Chip
          label={t.allCategories}
          variant={activeCategoryId === null ? "filled" : "outlined"}
          color={activeCategoryId === null ? "primary" : "default"}
          onClick={() => onCategoryChange(null)}
          sx={{ flexShrink: 0 }}
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
            sx={{ flexShrink: 0 }}
          />
        ))}
      </MobileHorizontalScrollRow>
    </MobileSectionPanel>
  );
}
