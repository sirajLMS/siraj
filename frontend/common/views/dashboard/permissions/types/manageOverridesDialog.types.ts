// NEW FOR PLAN v5 (newly created for the migration wave)
import type { ManageOverridesState } from "@/frontend/common/views/dashboard/permissions/components/useManageOverridesState";

export interface ManageOverridesDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  // NEW FOR PLAN v5: pre-computed manage-overrides dialog state composed by
  // the ViewModel (NS-3 N26 lift). The tier dialog consumes the flat bag as a
  // plain prop instead of calling `useManageOverridesState(...)` itself.
  readonly manageOverridesState: ManageOverridesState;
}
