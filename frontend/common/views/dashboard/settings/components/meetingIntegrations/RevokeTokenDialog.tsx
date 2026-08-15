"use client";

import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog/BaseDeleteDialog";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

export interface RevokeTokenDialogProps {
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly open: boolean;
  readonly revoking: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

export function RevokeTokenDialog({ labels, open, revoking, onConfirm, onCancel }: Readonly<RevokeTokenDialogProps>) {
  return (
    <BaseDeleteDialog
      open={open}
      onClose={onCancel}
      onConfirm={onConfirm}
      isLoading={revoking}
      title={labels.actions.revokeConfirmTitle}
      body={labels.actions.revokeConfirm}
      cancelLabel={labels.actions.cancel}
      confirmLabel={labels.actions.confirmRevoke}
    />
  );
}
