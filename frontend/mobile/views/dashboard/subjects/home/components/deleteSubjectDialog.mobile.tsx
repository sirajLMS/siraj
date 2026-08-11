"use client";

import type { DeleteSubjectDialogProps } from "@/frontend/common/views/dashboard/subjects/home/types";
import { DeleteEntityDialogShared } from "@/frontend/mobile/views/dashboard/subjects/home/components/__shared__/deleteEntityDialogShared";

const TITLE_ID = "delete-subject-dialog-title-mobile";

export function DeleteSubjectDialogMobile({
  labels,
  open,
  onClose,
  onConfirm,
  subjectName,
  isLoading,
}: Readonly<DeleteSubjectDialogProps>) {
  return (
    <DeleteEntityDialogShared
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
      entityName={subjectName}
      titleId={TITLE_ID}
      title={labels.deleteSubject}
      cancelLabel={labels.cancel}
      confirmMessage={labels.deleteSubjectConfirm}
    />
  );
}
