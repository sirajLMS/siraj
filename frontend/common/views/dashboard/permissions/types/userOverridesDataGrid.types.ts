// NEW FOR PLAN v5 (newly created for the migration wave)
import type { PermissionGroup, User } from "@/frontend/common/graphql/generated/gql/graphql-types";

export interface UserOverridesDataGridProps {
  readonly users: readonly User[];
  readonly groups: readonly PermissionGroup[];
  readonly onManageOverrides: (userId: string) => void;
  readonly loading?: boolean;
}
