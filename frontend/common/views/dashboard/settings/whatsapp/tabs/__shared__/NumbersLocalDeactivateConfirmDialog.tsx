"use client";

import { useCallback, useState } from "react";
import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export function NumbersLocalDeactivateConfirmDialog({
  open,
  displayName,
  labels,
  onClose,
  onConfirm,
  fullScreen,
}: Readonly<{
  readonly open: boolean;
  readonly displayName: string;
  readonly labels: WhatsappLabels;
  readonly onClose: () => void;
  readonly onConfirm: () => Promise<void>;
  readonly fullScreen: boolean;
}>) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = useCallback(() => {
    setSubmitting(true);
    void onConfirm().finally(() => setSubmitting(false));
  }, [onConfirm]);

  return (
    <BaseDeleteDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      isLoading={submitting}
      title={labels.localDeactivateConfirmTitle}
      body={labels.localDeactivateConfirmMessage(displayName)}
      cancelLabel={labels.cancel}
      confirmLabel={labels.localDeactivateAccount}
      fullScreen={fullScreen}
    />
  );
}
