// NEW FOR PLAN v5 (newly created for the migration wave)
import type { Permission } from "@/frontend/common/graphql/generated/gql/graphql-types";

export interface AddPermissionsTabProps {
  readonly filteredAvailablePermissions: readonly Permission[];
  readonly selectedAddPermissionIds: readonly string[];
  readonly searchQuery: string;
  readonly selectedCategory: string;
  readonly addCategories: readonly string[];
  readonly onAssignPermissions: () => void;
  readonly onPermissionToggle: (id: string, checked: boolean) => void;
  readonly onSearchChange: (value: string) => void;
  readonly onCategoryChange: (value: string) => void;
  readonly loading?: boolean;
}
