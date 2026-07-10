"use client";

import { AddOutlined, DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, Chip, IconButton, Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import { SectionPanel } from "@/frontend/components/ui";
import type { CategoriesSectionProps } from "@/frontend/views/dashboard/subjects/home/types";

export function CategoriesSection({
  categories,
  activeCategoryId,
  onCategoryChange,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory,
  canManage,
}: Readonly<CategoriesSectionProps>) {
  const t = useTranslations("dashboard.subjects");

  return (
    <SectionPanel
      title={t("categoriesTitle")}
      actions={
        canManage ? (
          <IconButton onClick={onCreateCategory} size="small" aria-label={t("createCategory")}>
            <AddOutlined fontSize="small" />
          </IconButton>
        ) : undefined
      }
    >
      <Stack sx={{ flexDirection: "row", flexWrap: "wrap", gap: 1, p: 2 }}>
        <Chip
          label={t("allCategories")}
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
                    aria-label={t("editCategory")}
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
