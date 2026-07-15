"use client";

import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog/BaseDeleteDialog";
import type { DeleteSubjectDialogProps } from "@/frontend/common/views/dashboard/subjects/home/types";
import { useAppTranslation } from "@/shared/locale/client";

export function DeleteSubjectDialog({
  open,
  onClose,
  onConfirm,
  subjectName,
  isLoading,
}: Readonly<DeleteSubjectDialogProps>) {
  const t = useAppTranslation("dashboard.subjects");

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
