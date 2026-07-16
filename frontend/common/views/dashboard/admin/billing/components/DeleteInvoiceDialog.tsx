"use client";

import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog/BaseDeleteDialog";
import { useAppTranslation } from "@/shared/locale/client";

export type DeleteInvoiceDialogProps = {
  readonly open: boolean;
  readonly invoiceId: string | null;
  readonly isLoading: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
};

export function DeleteInvoiceDialog({ open, invoiceId, isLoading, onClose, onConfirm }: DeleteInvoiceDialogProps) {
  const t = useAppTranslation().dashboardTranslations.billing;
  const tc = useAppTranslation().commonTranslations;

  const displayId = invoiceId ? invoiceId.replace("inv-", "INV-").toUpperCase() : "";

  return (
    <BaseDeleteDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
      title={t.deleteInvoiceDialog.title}
      body={t.deleteInvoiceDialog.body(displayId)}
      cancelLabel={tc.cancel}
      confirmLabel={t.deleteInvoiceDialog.confirm}
    />
  );
}
