// NEW FOR PLAN v5 (newly created for the migration wave)
import type { PermissionGroup, User } from "@/frontend/common/graphql/generated/gql/graphql-types";

export interface OverridesUserSidebarProps {
  readonly user: User;
  readonly userGroups: readonly PermissionGroup[];
}
