"use client";

import { Alert } from "@mui/material";
import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog/BaseDeleteDialog";
import type { MeetingConfigEnhancementLabels } from "@/shared/locale/types/ui";

export type DisconnectConfirmDialogLabels = Pick<
  MeetingConfigEnhancementLabels,
  "disconnectWarningTitle" | "disconnectWarningMessage" | "disconnectWarningImpact" | "disconnect" | "cancel"
>;

export interface DisconnectConfirmDialogProps {
  readonly labels: DisconnectConfirmDialogLabels;
  readonly open: boolean;
  readonly providerName: string;
  readonly providerSlug: string;
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
  readonly onConfirm: (providerSlug: string) => void;
  readonly onClose: () => void;
}

export function DisconnectConfirmDialog({
  labels,
  open,
  providerName,
  providerSlug,
  isLoading,
  errorMessage,
  onConfirm,
  onClose,
}: Readonly<DisconnectConfirmDialogProps>) {
  const body = `${providerName}: ${labels.disconnectWarningMessage} ${labels.disconnectWarningImpact}`;

  const handleConfirm = () => {
    onConfirm(providerSlug);
  };

  return (
    <>
      {errorMessage ? (
        <Alert severity="error" sx={theme => ({ mb: 2, borderColor: theme.palette.error.main })}>
          {errorMessage}
        </Alert>
      ) : null}
      <BaseDeleteDialog
        open={open}
        onClose={onClose}
        onConfirm={handleConfirm}
        isLoading={isLoading}
        title={labels.disconnectWarningTitle}
        body={body}
        cancelLabel={labels.cancel}
        confirmLabel={labels.disconnect}
      />
    </>
  );
}
