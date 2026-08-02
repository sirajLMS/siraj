"use client";

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
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
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{labels.disconnectConfirmTitle}</DialogTitle>
      <DialogContent>
        <DialogContentText>{labels.disconnectConfirm}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={disconnecting}>
          {labels.cancel}
        </Button>
        <Button onClick={onConfirm} color="error" disabled={disconnecting}>
          {labels.confirmDisconnect}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
