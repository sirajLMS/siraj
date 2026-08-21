// NEW FOR PLAN v5 (newly created for the migration wave)

import type {
  PermissionGroupsQuery_permissionGroups,
  UsersQuery_users,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { PermissionsLabels } from "@/shared/locale";

export interface OverridesUserSidebarProps {
  readonly labels: PermissionsLabels;
  readonly user: UsersQuery_users;
  readonly userGroups: readonly PermissionGroupsQuery_permissionGroups[];
}
