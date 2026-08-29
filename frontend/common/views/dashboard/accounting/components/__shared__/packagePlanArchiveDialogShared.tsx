"use client";

import { ArchiveOutlined } from "@mui/icons-material";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

export interface PackagePlanArchiveDialogLabels {
  readonly title: string;
  readonly body: string;
  readonly cancel: string;
  readonly confirm: string;
}

export interface PackagePlanArchiveDialogSharedProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly archiving: boolean;
  readonly labels: PackagePlanArchiveDialogLabels;
}

/** Confirmation dialog for archiving a package plan; shared across viewport tiers. */
export function PackagePlanArchiveDialogShared({
  open,
  onClose,
  onConfirm,
  archiving,
  labels,
}: Readonly<PackagePlanArchiveDialogSharedProps>) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{labels.title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{labels.body}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={archiving}>
          {labels.cancel}
        </Button>
        <Button color="error" variant="contained" onClick={onConfirm} disabled={archiving}>
          {labels.confirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export interface PackagePlanArchiveTriggerButtonProps {
  readonly archiving: boolean;
  readonly planActive: boolean;
  readonly onOpen: () => void;
  readonly label: string;
}

/** Button that opens the archive confirmation dialog; disabled while archiving or plans already inactive. */
export function PackagePlanArchiveTriggerButton({
  archiving,
  planActive,
  onOpen,
  label,
}: Readonly<PackagePlanArchiveTriggerButtonProps>) {
  return (
    <Button
      color="error"
      variant="outlined"
      startIcon={<ArchiveOutlined />}
      onClick={onOpen}
      disabled={archiving || !planActive}
    >
      {label}
    </Button>
  );
}
