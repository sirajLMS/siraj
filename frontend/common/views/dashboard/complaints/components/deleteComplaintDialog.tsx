"use client";

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import type { DeleteComplaintDialogProps } from "@/frontend/common/views/dashboard/complaints/types/complaintsViewTypes";

export function DeleteComplaintDialog({
  open,
  onClose,
  onConfirm,
  isDeleting,
  labels,
}: Readonly<DeleteComplaintDialogProps>) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{labels.deleteConfirmTitle}</DialogTitle>
      <DialogContent>
        <DialogContentText>{labels.deleteConfirmBody}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{labels.deleteConfirmCancel}</Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={isDeleting}>
          {labels.deleteConfirmConfirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
