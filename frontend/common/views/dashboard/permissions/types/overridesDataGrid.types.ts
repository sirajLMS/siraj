// NEW FOR PLAN v5 (newly created for the migration wave)

import type {
  PermissionGroupDetailFieldsFragment,
  PermissionsQuery_permissions,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { OverrideState } from "@/frontend/common/views/dashboard/permissions/components/overrideState.types";
import type { PermissionsLabels } from "@/shared/locale";

export interface OverridesDataGridProps {
  readonly labels: PermissionsLabels;
  readonly filteredPermissions: readonly PermissionsQuery_permissions[];
  readonly userGroups: readonly PermissionGroupDetailFieldsFragment[];
  readonly localOverrides: Record<string, OverrideState>;
  readonly mode: "effective" | "edit";
  readonly isDialogLoading: boolean;
  readonly handleOverrideChange: (permissionId: string, state: OverrideState) => void;
}
