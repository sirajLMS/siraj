"use client";

import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog";
import type { ProfileNotificationsLabels } from "@/shared/locale/types/profile";

export type DisconnectConfirmDialogLabels = Pick<
  ProfileNotificationsLabels["connectAccount"],
  "disconnectConfirmTitle" | "disconnectConfirm" | "confirmDisconnect" | "cancel"
>;

export function DisconnectConfirmDialog({
  labels,
  open,
  disconnecting,
  onConfirm,
  onCancel,
}: {
  readonly labels: DisconnectConfirmDialogLabels;
  readonly open: boolean;
  readonly disconnecting: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}) {
  return (
    <BaseDeleteDialog
      open={open}
      onClose={onCancel}
      onConfirm={onConfirm}
      isLoading={disconnecting}
      title={labels.disconnectConfirmTitle}
      body={labels.disconnectConfirm}
      cancelLabel={labels.cancel}
      confirmLabel={labels.confirmDisconnect}
    />
  );
}
