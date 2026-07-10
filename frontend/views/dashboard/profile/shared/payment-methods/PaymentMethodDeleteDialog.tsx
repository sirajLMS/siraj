"use client";

import { useTranslations } from "next-intl";
import { BaseDeleteDialog } from "@/frontend/components/ui/dialog/BaseDeleteDialog";

export type PaymentMethodDeleteDialogProps = {
  readonly open: boolean;
  readonly methodLabel: string;
  readonly isLoading: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
};

export function PaymentMethodDeleteDialog({
  open,
  methodLabel,
  isLoading,
  onClose,
  onConfirm,
}: PaymentMethodDeleteDialogProps) {
  const t = useTranslations("ui.paymentMethod.manager");

  return (
    <BaseDeleteDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
      title={t("deleteTitle")}
      body={t("deleteBody", { name: methodLabel })}
      cancelLabel={t("cancel")}
      confirmLabel={t("deleteConfirm")}
    />
  );
}
