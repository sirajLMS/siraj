"use client";

import { useTranslations } from "next-intl";
import { BaseDeleteDialog } from "@/frontend/components/ui/dialog/BaseDeleteDialog";
import type { DeleteSubjectDialogProps } from "@/frontend/views/dashboard/subjects/home/types";

export function DeleteSubjectDialog({
  open,
  onClose,
  onConfirm,
  subjectName,
  isLoading,
}: Readonly<DeleteSubjectDialogProps>) {
  const t = useTranslations("dashboard.subjects");

  return (
    <BaseDeleteDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
      title={t("deleteSubject")}
      body={t("deleteSubjectConfirm", { name: subjectName })}
      cancelLabel={t("cancel")}
      confirmLabel={t("deleteSubject")}
    />
  );
}
