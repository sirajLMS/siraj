// NEW FOR PLAN v5 (newly created for the migration wave)

import type { Permission, PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { PermissionsLabels } from "@/shared/locale";

export interface BasePermissionCatalogListProps {
  readonly labels: PermissionsLabels;
  readonly permissions: readonly Permission[];
  readonly groups: readonly PermissionGroup[];
}
