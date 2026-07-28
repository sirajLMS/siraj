// NEW FOR PLAN v5 (newly created for the migration wave)
import type { PermissionsLabels } from "@/shared/locale";
export interface DeleteGroupDialogProps {
  readonly labels: PermissionsLabels;
  readonly open: boolean;
  readonly groupName: string;
  readonly isLoading: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}
