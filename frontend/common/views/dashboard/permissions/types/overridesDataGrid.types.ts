// NEW FOR PLAN v5 (newly created for the migration wave)
import type { Permission, PermissionGroup } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { OverrideState } from "@/frontend/common/views/dashboard/permissions/components/overrideState.types";

export interface OverridesDataGridProps {
  readonly filteredPermissions: readonly Permission[];
  readonly userGroups: readonly PermissionGroup[];
  readonly localOverrides: Record<string, OverrideState>;
  readonly mode: "effective" | "edit";
  readonly isDialogLoading: boolean;
  readonly handleOverrideChange: (permissionId: string, state: OverrideState) => void;
}
