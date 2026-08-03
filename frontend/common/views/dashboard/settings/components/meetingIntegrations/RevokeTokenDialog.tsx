"use client";

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";

export function RevokeTokenDialog({
  labels,
  open,
  revoking,
  onConfirm,
  onCancel,
}: {
  readonly labels: SettingsMeetingIntegrationsLabels;
  readonly open: boolean;
  readonly revoking: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{labels.actions.revokeConfirmTitle}</DialogTitle>
      <DialogContent>
        <DialogContentText>{labels.actions.revokeConfirm}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={revoking}>
          {labels.actions.cancel}
        </Button>
        <Button onClick={onConfirm} color="error" disabled={revoking}>
          {labels.actions.confirmRevoke}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
