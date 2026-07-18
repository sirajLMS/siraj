// NEW FOR PLAN v5 (newly created for the migration wave)
import type { PermissionsLabels } from "@/shared/locale";

export interface AddPermissionBulkBarProps {
  readonly selectedCount: number;
  readonly onAssignPermissions: () => void;
  readonly t: PermissionsLabels;
}
