"use client";

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, type Theme } from "@mui/material";
import { BaseDeleteDialog } from "@/frontend/common/components/ui/dialog";

interface LeaveDialogProps {
  readonly open: boolean;
  readonly reason: string;
  readonly isProcessing: boolean;
  readonly onReasonChange: (reason: string) => void;
  readonly onClose: () => void;
  readonly onSubmit: () => void;
  readonly labels: {
    readonly title: string;
    readonly reasonLabel: string;
    readonly cancel: string;
    readonly submit: string;
  };
}

export function LeaveDialog({
  open,
  reason,
  isProcessing,
  onReasonChange,
  onClose,
  onSubmit,
  labels,
}: LeaveDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{labels.title}</DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          label={labels.reasonLabel}
          type="text"
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          value={reason}
          onChange={e => onReasonChange(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{labels.cancel}</Button>
        <Button onClick={onSubmit} variant="contained" disabled={!reason.trim() || isProcessing}>
          {labels.submit}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface ConfirmationDialogProps {
  readonly open: boolean;
  readonly isProcessing: boolean;
  readonly onClose: () => void;
  readonly onSubmit: () => void;
  readonly submitColor: "warning" | "error";
  readonly labels: {
    readonly title: string;
    readonly confirmation: string;
    readonly cancel: string;
    readonly submit: string;
  };
}

const warningConfirmSx = (theme: Theme) =>
  ({
    py: 1.5,
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.onWarning,
    "&:hover": { backgroundColor: theme.palette.warning.dark },
  }) as const;

export function ConfirmationDialog({
  open,
  isProcessing,
  onClose,
  onSubmit,
  submitColor,
  labels,
}: ConfirmationDialogProps) {
  return (
    <BaseDeleteDialog
      open={open}
      onClose={onClose}
      onConfirm={onSubmit}
      isLoading={isProcessing}
      title={labels.title}
      body={labels.confirmation}
      cancelLabel={labels.cancel}
      confirmLabel={labels.submit}
      confirmSx={submitColor === "warning" ? warningConfirmSx : undefined}
    />
  );
}
