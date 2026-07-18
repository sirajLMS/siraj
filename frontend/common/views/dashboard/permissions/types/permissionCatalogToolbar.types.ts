// NEW FOR PLAN v5 (newly created for the migration wave)
export interface PermissionCatalogToolbarProps {
  readonly searchQuery: string;
  readonly selectedCategory: string;
  readonly categories: readonly string[];
  readonly onSearchChange: (value: string) => void;
  readonly onCategoryChange: (value: string) => void;
}
