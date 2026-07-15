"use client";

import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog/BaseDeleteDialog";
import type { DeleteCategoryDialogProps } from "@/frontend/common/views/dashboard/subjects/home/types";
import { useAppTranslation } from "@/shared/locale/client";

export function DeleteCategoryDialog({
  open,
  onClose,
  onConfirm,
  categoryName,
  isLoading,
}: Readonly<DeleteCategoryDialogProps>) {
  const t = useAppTranslation("dashboard.subjects");

  return (
    <BaseDeleteDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
      title={t.deleteCategory}
      body={t.deleteCategoryConfirm(categoryName)}
      cancelLabel={t.cancel}
      confirmLabel={t.deleteCategory}
    />
  );
}
