"use client";

import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog";

interface AppearanceResetDialogLabels {
  readonly resetConfirmTitle: string;
  readonly resetConfirmBody: string;
  readonly resetConfirmCancel: string;
  readonly resetConfirmConfirm: string;
}

export interface AppearanceResetDialogProps {
  readonly open: boolean;
  readonly loading: boolean;
  readonly labels: AppearanceResetDialogLabels;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}

export function AppearanceResetDialog({ open, loading, labels, onClose, onConfirm }: AppearanceResetDialogProps) {
  return (
    <BaseDeleteDialog
      open={open}
      isLoading={loading}
      onClose={onClose}
      onConfirm={onConfirm}
      title={labels.resetConfirmTitle}
      body={labels.resetConfirmBody}
      cancelLabel={labels.resetConfirmCancel}
      confirmLabel={labels.resetConfirmConfirm}
    />
  );
}
