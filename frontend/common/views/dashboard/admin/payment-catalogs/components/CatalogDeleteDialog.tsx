"use client";

import { useTranslations } from "next-intl";
import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog/BaseDeleteDialog";
import type { CatalogDeleteDialogProps } from "@/frontend/common/views/dashboard/admin/payment-catalogs/types";

export function CatalogDeleteDialog({
  open,
  entryName,
  isLoading,
  onClose,
  onConfirm,
}: Readonly<CatalogDeleteDialogProps>) {
  const t = useTranslations("dashboard.paymentCatalogs");

  return (
    <BaseDeleteDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
      title={t("deleteTitle")}
      body={t("deleteBody", { name: entryName })}
      cancelLabel={t("cancel")}
      confirmLabel={t("deleteConfirm")}
    />
  );
}
