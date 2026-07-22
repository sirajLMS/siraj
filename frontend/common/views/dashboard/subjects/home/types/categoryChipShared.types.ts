import type { SxProps, Theme } from "@mui/material";

// Shared props for the per-category `Chip` reused by both desktop and mobile
// `CategoriesSection` tier files. Lifted out to satisfy the SonarQube
// duplication cluster flagged on the byte-identical `deleteIcon` Box +
// `IconButton (EditOutlined)` + `DeleteOutlined` tree.
export interface CategoryChipSharedProps {
  readonly label: string | null | undefined;
  readonly isActive: boolean;
  readonly onClick: () => void;
  readonly onDelete?: () => void;
  readonly onEdit?: () => void;
  readonly canManage: boolean;
  readonly editAriaLabel: string;
  /** Tier-specific sx passthrough (e.g. mobile `flexShrink: 0`). */
  readonly sx?: SxProps<Theme>;
}
