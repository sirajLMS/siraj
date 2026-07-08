"use client";

import { useTranslations } from "next-intl";
import { BaseDeleteDialog } from "@/frontend/components/ui/dialog/BaseDeleteDialog";
import type { DeleteCategoryDialogProps } from "../types";

export function DeleteCategoryDialog({
  open,
  onClose,
  onConfirm,
  categoryName,
  isLoading,
}: Readonly<DeleteCategoryDialogProps>) {
  const t = useTranslations("dashboard.subjects");

  return (
    <BaseDeleteDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
      title={t("deleteCategory")}
      body={t("deleteCategoryConfirm", { name: categoryName })}
      cancelLabel={t("cancel")}
      confirmLabel={t("deleteCategory")}
    />
  );
}
