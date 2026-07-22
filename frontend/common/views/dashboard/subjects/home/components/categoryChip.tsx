"use client";

import { DeleteOutlined, EditOutlined } from "@mui/icons-material";
import { Box, Chip, IconButton } from "@mui/material";
import type { CategoryChipSharedProps } from "@/frontend/common/views/dashboard/subjects/home/types/categoryChipShared.types";

/**
 * CategoryChip — the per-category filter/management chip reused by both the
 * desktop (`Stack`) and mobile (`MobileHorizontalScrollRow`) CategoriesSection
 * tier variants. Lifted out to satisfy the SonarQube duplication cluster
 * flagged on the byte-identical `Chip` + `deleteIcon` Box containing
 * `<IconButton><EditOutlined/></IconButton>` + `<DeleteOutlined/>`.
 *
 * The "all categories" chip stays inline in each tier file (it carries
 * tier-specific `flexShrink: 0` on mobile) — only the per-`cat` chip is shared.
 */
export function CategoryChip({
  label,
  isActive,
  onClick,
  onDelete,
  onEdit,
  canManage,
  editAriaLabel,
  sx,
}: Readonly<CategoryChipSharedProps>) {
  return (
    <Chip
      label={label}
      variant={isActive ? "filled" : "outlined"}
      color={isActive ? "primary" : "default"}
      onClick={onClick}
      onDelete={canManage ? onDelete : undefined}
      deleteIcon={
        canManage ? (
          <Box sx={{ display: "flex" }}>
            <IconButton
              size="small"
              onClick={e => {
                e.stopPropagation();
                onEdit?.();
              }}
              aria-label={editAriaLabel}
            >
              <EditOutlined sx={{ fontSize: 14 }} />
            </IconButton>
            <DeleteOutlined sx={{ fontSize: 16 }} />
          </Box>
        ) : undefined
      }
      sx={sx}
    />
  );
}
