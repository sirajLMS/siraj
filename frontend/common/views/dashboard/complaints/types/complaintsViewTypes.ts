import type { ComplaintsLabels } from "@/shared/locale/types/dashboard/complaints";

export interface DeleteComplaintDialogLabels {
  readonly deleteConfirmTitle: string;
  readonly deleteConfirmBody: string;
  readonly deleteConfirmCancel: string;
  readonly deleteConfirmConfirm: string;
}

export interface DeleteComplaintDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly isDeleting: boolean;
  readonly labels: DeleteComplaintDialogLabels;
}

export function buildDeleteComplaintDialogLabels(
  queueLabels: ComplaintsLabels["admin"]["queue"]
): DeleteComplaintDialogLabels {
  return {
    deleteConfirmTitle: queueLabels.deleteConfirmTitle,
    deleteConfirmBody: queueLabels.deleteConfirmBody,
    deleteConfirmCancel: queueLabels.deleteConfirmCancel,
    deleteConfirmConfirm: queueLabels.deleteConfirmConfirm,
  };
}
