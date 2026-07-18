// NEW FOR PLAN v5 (newly created for the migration wave)
import type { Permission, PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";

export interface BasePermissionCatalogListProps {
  readonly permissions: readonly Permission[];
  readonly groups: readonly PermissionGroup[];
}
