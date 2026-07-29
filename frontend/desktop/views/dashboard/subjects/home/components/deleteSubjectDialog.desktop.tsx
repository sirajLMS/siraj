"use client";

import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog/BaseDeleteDialog";
import type { DeleteSubjectDialogProps } from "@/frontend/common/views/dashboard/subjects/home/types";

/**
 * DeleteSubjectDialogDesktop — delegates to the shared `BaseDeleteDialog`
 * (`xs`-width centered confirmation) which is the desktop-oriented geometry.
 */
export function DeleteSubjectDialogDesktop({
  labels,
  open,
  onClose,
  onConfirm,
  subjectName,
  isLoading,
}: Readonly<DeleteSubjectDialogProps>) {
  const t = labels;

  return (
    <BaseDeleteDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
      title={t.deleteSubject}
      body={t.deleteSubjectConfirm(subjectName)}
      cancelLabel={t.cancel}
      confirmLabel={t.deleteSubject}
    />
  );
}
