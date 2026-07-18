// NEW FOR PLAN v5 (newly created for the migration wave)

import type { ValidPermission } from "@/frontend/common/views/dashboard/permissions/types/validPermission.types";
import type { PermissionsLabels } from "@/shared/locale";

export interface PermissionRowProps {
  readonly perm: ValidPermission;
  readonly isChecked: boolean;
  readonly onTogglePermission: (permId: string, isSystem: boolean) => void;
  readonly isLoading: boolean;
  readonly t: PermissionsLabels;
}
