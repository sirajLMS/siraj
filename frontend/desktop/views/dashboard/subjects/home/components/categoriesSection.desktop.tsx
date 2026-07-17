"use client";

import { AddOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, Chip, IconButton, Stack } from "@mui/material";
import { SectionPanel } from "@/frontend/common/components/ui";
import type { CategoriesSectionProps } from "@/frontend/common/views/dashboard/subjects/home/types";
import { useAppTranslation } from "@/shared/locale";

/**
 * CategoriesSectionDesktop — desktop-tier category management panel.
 *
 * Renders the chip row flush against the panel interior (desktop keeps the
 * tighter original `p: 2` square padding rather than the mobile variant's
 * full-bleed horizontal stretch).
 */
export function CategoriesSectionDesktop({
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
    <SectionPanel
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
    </SectionPanel>
  );
}
