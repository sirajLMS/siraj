// NEW FOR PLAN v5 (newly created for the migration wave)
import type { PermissionsLabels } from "@/shared/locale";
export interface PermissionCatalogToolbarProps {
  readonly labels: PermissionsLabels;
  readonly searchQuery: string;
  readonly selectedCategory: string;
  readonly categories: readonly string[];
  readonly onSearchChange: (value: string) => void;
  readonly onCategoryChange: (value: string) => void;
}
