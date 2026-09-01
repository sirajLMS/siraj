"use client";

import { Chip } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { CategoryChip } from "@/frontend/common/views/dashboard/subjects/home/components/categoryChip";
import type { CategoriesSectionProps } from "@/frontend/common/views/dashboard/subjects/home/types";

interface CategoryChipListSlotProps {
  /** Sx applied to each chip (mobile adds flexShrink: 0 for scroll). */
  readonly chipSx: SxProps<Theme> | undefined;
}

export interface CategoryChipListSharedProps
  extends Pick<
    CategoriesSectionProps,
    | "labels"
    | "categories"
    | "activeCategoryId"
    | "onCategoryChange"
    | "onEditCategory"
    | "onDeleteCategory"
    | "canManage"
  > {
  readonly slots: CategoryChipListSlotProps;
}

/**
 * Shared "All Categories" chip + per-category `CategoryChip` list.
 *
 * Both desktop and mobile `CategoriesSection` variants duplicate this exact
 * block — only the outer container (`DesktopSectionPanel` vs
 * `MobileSectionPanel` + `MobileHorizontalScrollRow`) and the `flexShrink: 0`
 * on mobile chips differ.
 */
export function CategoryChipListShared({
  labels,
  categories,
  activeCategoryId,
  onCategoryChange,
  onEditCategory,
  onDeleteCategory,
  canManage,
  slots,
}: Readonly<CategoryChipListSharedProps>) {
  const t = labels;

  return (
    <>
      <Chip
        label={t.allCategories}
        variant={activeCategoryId === null ? "filled" : "outlined"}
        color={activeCategoryId === null ? "primary" : "default"}
        onClick={() => onCategoryChange(null)}
        sx={slots.chipSx}
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
          sx={slots.chipSx}
        />
      ))}
    </>
  );
}
