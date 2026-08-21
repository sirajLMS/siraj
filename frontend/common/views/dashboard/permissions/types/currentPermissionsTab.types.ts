// NEW FOR PLAN v5 (newly created for the migration wave)

import type {
  PermissionFieldsFragment,
  PermissionGroupDetailFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { PermissionsLabels } from "@/shared/locale";

export interface CurrentPermissionsTabProps {
  readonly labels: PermissionsLabels;
  readonly group: PermissionGroupDetailFieldsFragment;
  readonly groupPermissions: readonly PermissionFieldsFragment[];
  readonly permissionsCount: number;
  readonly onRevokePermission: (permissionId: string) => Promise<void>;
  readonly onSwitchToAddTab: () => void;
  readonly loading?: boolean;
}
