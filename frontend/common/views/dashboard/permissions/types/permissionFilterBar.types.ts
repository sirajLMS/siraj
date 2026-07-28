// NEW FOR PLAN v5 (newly created for the migration wave)
import type { PermissionsLabels } from "@/shared/locale";
export interface PermissionFilterBarProps {
  readonly labels: PermissionsLabels;
  readonly searchTerm: string;
  readonly onSearchChange: (value: string) => void;
  readonly selectedCategory: string;
  readonly onCategoryChange: (value: string) => void;
  readonly categories: readonly string[];
  readonly selectedCount: number;
  readonly isLoading: boolean;
}
