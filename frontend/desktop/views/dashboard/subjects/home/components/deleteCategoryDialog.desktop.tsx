"use client";

import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog/BaseDeleteDialog";
import type { DeleteCategoryDialogProps } from "@/frontend/common/views/dashboard/subjects/home/types";
import { useAppTranslation } from "@/shared/locale";

/**
 * DeleteCategoryDialogDesktop — delegates to the shared `BaseDeleteDialog`
 * (`xs`-width centered confirmation) which is the desktop-oriented geometry.
 */
export function DeleteCategoryDialogDesktop({
  open,
  onClose,
  onConfirm,
  categoryName,
  isLoading,
}: Readonly<DeleteCategoryDialogProps>) {
  const t = useAppTranslation().dashboardTranslations.subjects;

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
