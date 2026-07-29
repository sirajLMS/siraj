"use client";

import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog/BaseDeleteDialog";
import type { PaymentMethodManagerLabels } from "@/shared/locale/types/ui";

export type PaymentMethodDeleteDialogProps = {
  readonly open: boolean;
  readonly methodLabel: string;
  readonly isLoading: boolean;
  readonly labels: PaymentMethodManagerLabels;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
};

export function PaymentMethodDeleteDialog({
  open,
  methodLabel,
  isLoading,
  labels,
  onClose,
  onConfirm,
}: PaymentMethodDeleteDialogProps) {
  const t = labels;

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
