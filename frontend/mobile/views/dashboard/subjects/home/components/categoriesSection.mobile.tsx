"use client";

import { AddOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { CategoryChipListShared } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/categoryChipListShared";
import type { CategoriesSectionProps } from "@/frontend/common/views/dashboard/subjects/home/types";
import { MobileHorizontalScrollRow, MobileSectionPanel } from "@/frontend/mobile/components/ui/container";

const MOBILE_CHIP_SLOTS = { chipSx: { flexShrink: 0 } } as const;

/**
 * CategoriesSectionMobile — mobile-tier category filter strip.
 * Horizontal scroll row so chips stay on one swipeable line.
 */
export function CategoriesSectionMobile({
  labels,
  categories,
  activeCategoryId,
  onCategoryChange,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory,
  canManage,
}: Readonly<CategoriesSectionProps>) {
  const t = labels;

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
        <CategoryChipListShared
          labels={labels}
          categories={categories}
          activeCategoryId={activeCategoryId}
          onCategoryChange={onCategoryChange}
          onEditCategory={onEditCategory}
          onDeleteCategory={onDeleteCategory}
          canManage={canManage}
          slots={MOBILE_CHIP_SLOTS}
        />
      </MobileHorizontalScrollRow>
    </MobileSectionPanel>
  );
}
