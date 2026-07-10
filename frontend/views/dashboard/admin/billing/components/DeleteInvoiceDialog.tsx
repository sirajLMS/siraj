"use client";

import { useTranslations } from "next-intl";
import { BaseDeleteDialog } from "@/frontend/components/ui/dialog/BaseDeleteDialog";

export type DeleteInvoiceDialogProps = {
  readonly open: boolean;
  readonly invoiceId: string | null;
  readonly isLoading: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
};

export function DeleteInvoiceDialog({ open, invoiceId, isLoading, onClose, onConfirm }: DeleteInvoiceDialogProps) {
  const t = useTranslations("dashboard.billing.deleteInvoiceDialog");
  const tc = useTranslations("common");

  const displayId = invoiceId ? invoiceId.replace("inv-", "INV-").toUpperCase() : "";

  return (
    <BaseDeleteDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
      title={t("title")}
      body={t("body", { invoiceId: displayId })}
      cancelLabel={tc("cancel")}
      confirmLabel={t("confirm")}
    />
  );
}
