// NEW FOR PLAN v5 (newly created for the migration wave)

import type { Permission, PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { PermissionsLabels } from "@/shared/locale";

export interface CurrentPermissionsTabProps {
  readonly labels: PermissionsLabels;
  readonly group: PermissionGroup;
  readonly groupPermissions: readonly Permission[];
  readonly permissionsCount: number;
  readonly onRevokePermission: (permissionId: string) => Promise<void>;
  readonly onSwitchToAddTab: () => void;
  readonly loading?: boolean;
}
