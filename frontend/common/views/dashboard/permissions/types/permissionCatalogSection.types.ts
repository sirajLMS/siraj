// NEW FOR PLAN v5 (newly created for the migration wave)

import type { Permission, PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { PermissionsLabels } from "@/shared/locale";

export interface PermissionCatalogSectionProps {
  readonly labels: PermissionsLabels;
  readonly permissions: readonly Permission[];
  readonly groups: readonly PermissionGroup[];
  // NEW FOR PLAN v5: lifted-from-tier filter state + derived data (NS-2 N7 + N11 lift)
  readonly searchQuery: string;
  readonly setSearchQuery: (query: string) => void;
  readonly selectedCategory: string;
  readonly setSelectedCategory: (category: string) => void;
  readonly categories: readonly string[];
  readonly filteredPermissions: readonly Permission[];
  readonly loading?: boolean;
}
