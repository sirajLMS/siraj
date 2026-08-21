// NEW FOR PLAN v5 (newly created for the migration wave)

import type {
  PermissionGroupDetailFieldsFragment,
  PermissionsQuery_permissions,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { PermissionsLabels } from "@/shared/locale";

export interface BasePermissionCatalogListProps {
  readonly labels: PermissionsLabels;
  readonly permissions: readonly PermissionsQuery_permissions[];
  readonly groups: readonly PermissionGroupDetailFieldsFragment[];
}
