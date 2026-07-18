// NEW FOR PLAN v5 (newly created for the migration wave)
import type { PermissionsLabels } from "@/shared/locale";

export interface AddPermissionFilterBarProps {
  readonly searchQuery: string;
  readonly onSearchChange: (value: string) => void;
  readonly selectedCategory: string;
  readonly onCategoryChange: (value: string) => void;
  readonly addCategories: readonly string[];
  readonly t: PermissionsLabels;
}
