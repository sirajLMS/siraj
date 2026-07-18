// NEW FOR PLAN v5 (newly created for the migration wave)
import type { PermissionsLabels } from "@/shared/locale";

export interface OverridesDialogFooterProps {
  readonly onClose: () => void;
  readonly handleSave: () => Promise<void>;
  readonly isDialogLoading: boolean;
  readonly isSaving: boolean;
  readonly t: PermissionsLabels;
}
