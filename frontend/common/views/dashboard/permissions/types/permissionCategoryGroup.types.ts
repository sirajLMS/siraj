// NEW FOR PLAN v5 (newly created for the migration wave)
import type { PermissionsQuery_permissions } from "@/frontend/common/graphql/generated/gql/graphql";
import type { ValidPermission } from "@/frontend/common/views/dashboard/permissions/types/validPermission.types";
import type { PermissionsLabels } from "@/shared/locale";

export type { ValidPermission };

export interface PermissionCategoryGroupProps {
  readonly categoryName: string;
  readonly perms: ValidPermission[];
  readonly selectedPermissionIds: readonly string[];
  readonly allChecked: boolean;
  readonly indeterminate: boolean;
  readonly onSelectAllCategory: (
    categoryPerms: Array<PermissionsQuery_permissions & { id: string }>,
    checked: boolean
  ) => void;
  readonly onTogglePermission: (permId: string, isSystem: boolean) => void;
  readonly isLoading: boolean;
  readonly t: PermissionsLabels;
}
