"use client";

import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog/BaseDeleteDialog";
import { useAppTranslation } from "@/shared/locale";

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
  const t = useAppTranslation().uiTranslations.paymentMethodManager;

  return (
    <BaseDeleteDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
      title={t.deleteTitle}
      body={t.deleteBody(methodLabel)}
      cancelLabel={t.cancel}
      confirmLabel={t.deleteConfirm}
    />
  );
}
