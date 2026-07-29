// NEW FOR PLAN v5 (newly created for the migration wave)

import type { PermissionGroup, User } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { PermissionsLabels } from "@/shared/locale";

export interface OverridesUserSidebarProps {
  readonly labels: PermissionsLabels;
  readonly user: User;
  readonly userGroups: readonly PermissionGroup[];
}
