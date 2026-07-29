"use client";

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import type { DeleteGroupDialogProps } from "@/frontend/common/views/dashboard/permissions/types";

/**
 * DeleteGroupDialogDesktop — desktop tier-paired confirmation dialog.
 */
export function DeleteGroupDialogDesktop({
  labels,
  open,
  groupName,
  isLoading,
  onClose,
  onConfirm,
}: Readonly<DeleteGroupDialogProps>) {
  const t = labels;

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="delete-group-dialog-title-desktop"
    >
      <DialogTitle id="delete-group-dialog-title-desktop">{t.deleteConfirmTitle}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mt: 1 }}>{t.deleteConfirmBody(groupName)}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          disabled={isLoading}
          variant="text"
          sx={theme => ({
            color: theme.palette.text.secondary,
            fontWeight: 700,
            borderRadius: 1.5,
          })}
        >
          {t.cancel}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isLoading}
          variant="contained"
          sx={theme => ({
            backgroundColor: theme.palette.error.main,
            color: theme.palette.onError,
            fontWeight: 700,
            borderRadius: 1.5,
            "&:hover": {
              backgroundColor: theme.palette.error.dark,
            },
          })}
        >
          {t.actionDelete}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
