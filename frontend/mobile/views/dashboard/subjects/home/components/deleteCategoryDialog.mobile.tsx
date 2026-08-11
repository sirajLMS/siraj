"use client";

import type { DeleteCategoryDialogProps } from "@/frontend/common/views/dashboard/subjects/home/types";
import { DeleteEntityDialogShared } from "@/frontend/mobile/views/dashboard/subjects/home/components/__shared__/deleteEntityDialogShared";

const TITLE_ID = "delete-category-dialog-title-mobile";

export function DeleteCategoryDialogMobile({
  labels,
  open,
  onClose,
  onConfirm,
  categoryName,
  isLoading,
}: Readonly<DeleteCategoryDialogProps>) {
  return (
    <DeleteEntityDialogShared
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
      entityName={categoryName}
      titleId={TITLE_ID}
      title={labels.deleteCategory}
      cancelLabel={labels.cancel}
      confirmMessage={labels.deleteCategoryConfirm}
    />
  );
}
