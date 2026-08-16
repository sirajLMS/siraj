"use client";

import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useCallback, useState } from "react";
import type { WhatsappLabels } from "@/shared/locale/types/whatsapp";

export function NumbersDeleteConfirmDialog({
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

  const handleConfirm = useCallback(async () => {
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  }, [onConfirm]);

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen}>
      <DialogTitle>{labels.deleteConfirmTitle}</DialogTitle>
      <DialogContent>
        <DialogContentText>{labels.deleteConfirmMessage(displayName)}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{labels.cancel}</Button>
        <Button variant="contained" color="error" disabled={submitting} onClick={handleConfirm}>
          {submitting ? <CircularProgress size={20} /> : labels.deleteAccount}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
