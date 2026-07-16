"use client";

import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog/BaseDeleteDialog";
import type { CatalogDeleteDialogProps } from "@/frontend/common/views/dashboard/admin/payment-catalogs/types";
import { useAppTranslation } from "@/shared/locale/client";

export function CatalogDeleteDialog({
  open,
  entryName,
  isLoading,
  onClose,
  onConfirm,
}: Readonly<CatalogDeleteDialogProps>) {
  const t = useAppTranslation().dashboardTranslations.paymentCatalogs;

  return (
    <BaseDeleteDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
      title={t.deleteTitle}
      body={t.deleteBody(entryName)}
      cancelLabel={t.cancel}
      confirmLabel={t.deleteConfirm}
    />
  );
}
