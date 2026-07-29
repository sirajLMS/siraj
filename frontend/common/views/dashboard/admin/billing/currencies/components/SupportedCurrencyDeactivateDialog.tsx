"use client";

import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog/BaseDeleteDialog";
import type { SupportedCurrencyRow } from "@/frontend/common/views/dashboard/admin/billing/currencies/useSupportedCurrenciesViewModel";
import { Translation, useAppTranslation } from "@/shared/locale";

export interface SupportedCurrencyDeactivateDialogProps {
  readonly open: boolean;
  readonly row: SupportedCurrencyRow | null;
  readonly isLoading: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}

export function SupportedCurrencyDeactivateDialog({
  open,
  row,
  isLoading,
  onClose,
  onConfirm,
}: Readonly<SupportedCurrencyDeactivateDialogProps>) {
  const t = useAppTranslation(Translation.Dashboard.BillingSupportedCurrencies);

  return (
    <BaseDeleteDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isLoading}
      title={t.deactivateConfirmTitle}
      body={row?.code ? t.deactivateConfirmBody(row.code) : ""}
      cancelLabel={t.deactivateConfirmCancel}
      confirmLabel={t.deactivateConfirmConfirm}
    />
  );
}
