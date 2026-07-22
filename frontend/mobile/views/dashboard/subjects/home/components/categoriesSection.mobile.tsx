"use client";

import { AddOutlined } from "@mui/icons-material";
import { Chip, IconButton } from "@mui/material";
import { CategoryChip } from "@/frontend/common/views/dashboard/subjects/home/components/categoryChip";
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
      contentInset={false}
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
          <CategoryChip
            key={cat.id}
            label={cat.name}
            isActive={activeCategoryId === cat.id}
            onClick={() => onCategoryChange(cat.id ?? null)}
            onDelete={() => onDeleteCategory(cat.id ?? "")}
            onEdit={() => onEditCategory(cat.id ?? "")}
            canManage={canManage}
            editAriaLabel={t.editCategory}
            sx={{ flexShrink: 0 }}
          />
        ))}
      </MobileHorizontalScrollRow>
    </MobileSectionPanel>
  );
}
