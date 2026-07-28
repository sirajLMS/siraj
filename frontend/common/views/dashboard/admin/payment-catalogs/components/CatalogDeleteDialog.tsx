"use client";

import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog/BaseDeleteDialog";
import type { CatalogDeleteDialogProps } from "@/frontend/common/views/dashboard/admin/payment-catalogs/types";

export function CatalogDeleteDialog({
  labels,
  open,
  entryName,
  isLoading,
  onClose,
  onConfirm,
}: Readonly<CatalogDeleteDialogProps>) {
  const t = labels;

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
