"use client";

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { SharedDialogCancelButton } from "@/frontend/common/views/dashboard/permissions/components/__shared__/sharedDialogButtons";
import type { DeleteGroupDialogSharedProps } from "@/frontend/common/views/dashboard/permissions/types/deleteGroupDialogShared.types";

export function DeleteGroupDialogShared({ labels, props, slots }: Readonly<DeleteGroupDialogSharedProps>) {
  const { open, groupName, isLoading, onClose, onConfirm } = props;
  const t = labels;
  const { dialogVariant, formIdSuffix } = slots;

  const titleId = `delete-group-dialog-title-${formIdSuffix}`;

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} aria-labelledby={titleId} {...dialogVariant}>
      <DialogTitle id={titleId}>{t.deleteConfirmTitle}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mt: 1 }}>{t.deleteConfirmBody(groupName)}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <SharedDialogCancelButton label={t.cancel} disabled={isLoading} onClick={onClose} />
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
