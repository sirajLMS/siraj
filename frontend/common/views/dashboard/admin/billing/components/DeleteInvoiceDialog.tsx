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
  const t = useAppTranslation("dashboard").billing.deleteInvoiceDialog;
  const tc = useAppTranslation("common");

  const displayId = invoiceId ? invoiceId.replace("inv-", "INV-").toUpperCase() : "";

  return (
    <BaseDeleteDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
      title={t.title}
      body={t.body(displayId)}
      cancelLabel={tc.cancel}
      confirmLabel={t.confirm}
    />
  );
}
