// NEW FOR PLAN v5 (newly created for the migration wave)

import type {
  PermissionGroupDetailFieldsFragment as PermissionGroup,
  UsersQuery_users as User,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { PermissionsLabels } from "@/shared/locale";

export interface UserOverridesDataGridProps {
  readonly labels: PermissionsLabels;
  readonly users: readonly User[];
  readonly groups: readonly PermissionGroup[];
  readonly onManageOverrides: (userId: string) => void;
  readonly loading?: boolean;
}
