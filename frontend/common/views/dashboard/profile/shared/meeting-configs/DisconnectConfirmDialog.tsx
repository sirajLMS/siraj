"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useMediaQuery,
} from "@mui/material";
import { useId } from "react";
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
  const titleId = useId();
  const isMobile = useMediaQuery(theme => theme.breakpoints.down("sm"), { noSsr: true });
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth fullScreen={isMobile} aria-labelledby={titleId}>
      <DialogTitle id={titleId}>{labels.disconnectConfirmTitle}</DialogTitle>
      <DialogContent>
        <DialogContentText>{labels.disconnectConfirm}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={disconnecting} sx={{ minHeight: 48 }}>
          {labels.cancel}
        </Button>
        <Button onClick={onConfirm} color="error" disabled={disconnecting} sx={{ minHeight: 48 }}>
          {labels.confirmDisconnect}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
