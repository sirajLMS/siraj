// NEW FOR PLAN v5 (newly created for the migration wave)

import type { OverrideState } from "@/frontend/common/views/dashboard/permissions/components/overrideState.types";
import type { PermissionsLabels } from "@/shared/locale";

export interface OverrideEditControlsProps {
  readonly labels: PermissionsLabels;
  readonly permissionId: string;
  readonly overrideState: OverrideState;
  readonly isDialogLoading: boolean;
  readonly handleOverrideChange: (permissionId: string, state: OverrideState) => void;
}
