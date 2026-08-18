"use client";

import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog/BaseDeleteDialog";
import type { DeleteComplaintDialogProps } from "@/frontend/common/views/dashboard/complaints/types/complaintsViewTypes";

export function DeleteComplaintDialog({
  open,
  onClose,
  onConfirm,
  isDeleting,
  labels,
}: Readonly<DeleteComplaintDialogProps>) {
  return (
    <BaseDeleteDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isDeleting}
      title={labels.deleteConfirmTitle}
      body={labels.deleteConfirmBody}
      cancelLabel={labels.deleteConfirmCancel}
      confirmLabel={labels.deleteConfirmConfirm}
    />
  );
}
