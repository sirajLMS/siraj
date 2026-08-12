"use client";

import { AddOutlined } from "@mui/icons-material";
import { IconButton, Stack } from "@mui/material";
import { CategoryChipListShared } from "@/frontend/common/views/dashboard/subjects/home/components/__shared__/categoryChipListShared";
import type { CategoriesSectionProps } from "@/frontend/common/views/dashboard/subjects/home/types";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";

const DESKTOP_CHIP_SLOTS = { chipSx: undefined } as const;

/**
 * CategoriesSectionDesktop — desktop-tier category management panel.
 *
 * Renders the chip row flush against the panel interior (desktop keeps the
 * tighter original `p: 2` square padding rather than the mobile variant's
 * full-bleed horizontal stretch).
 */
export function CategoriesSectionDesktop({
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
    <DesktopSectionPanel
      title={t.categoriesTitle}
      actions={
        canManage ? (
          <IconButton onClick={onCreateCategory} size="small" aria-label={t.createCategory}>
            <AddOutlined fontSize="small" />
          </IconButton>
        ) : undefined
      }
    >
      <Stack sx={{ flexDirection: "row", flexWrap: "wrap", gap: 1, p: 2 }}>
        <CategoryChipListShared
          labels={labels}
          categories={categories}
          activeCategoryId={activeCategoryId}
          onCategoryChange={onCategoryChange}
          onEditCategory={onEditCategory}
          onDeleteCategory={onDeleteCategory}
          canManage={canManage}
          slots={DESKTOP_CHIP_SLOTS}
        />
      </Stack>
    </DesktopSectionPanel>
  );
}
