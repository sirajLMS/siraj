"use client";

import { AddOutlined } from "@mui/icons-material";
import { Chip, IconButton, Stack } from "@mui/material";
import { CategoryChip } from "@/frontend/common/views/dashboard/subjects/home/components/categoryChip";
import type { CategoriesSectionProps } from "@/frontend/common/views/dashboard/subjects/home/types";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";

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
        <Chip
          label={t.allCategories}
          variant={activeCategoryId === null ? "filled" : "outlined"}
          color={activeCategoryId === null ? "primary" : "default"}
          onClick={() => onCategoryChange(null)}
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
          />
        ))}
      </Stack>
    </DesktopSectionPanel>
  );
}
