"use client";

import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { useTranslations } from "next-intl";

interface DeleteGroupDialogProps {
  readonly open: boolean;
  readonly groupName: string;
  readonly isLoading: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}

/**
 * DeleteGroupDialog displays a modal dialog confirming if the SuperAdmin
 * wants to delete a permission group.
 */
export function DeleteGroupDialog({
  open,
  groupName,
  isLoading,
  onClose,
  onConfirm,
}: Readonly<DeleteGroupDialogProps>) {
  const t = useTranslations("dashboard.permissions");

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="delete-group-dialog-title"
    >
      <DialogTitle id="delete-group-dialog-title">{t("deleteConfirmTitle")}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mt: 1 }}>{t("deleteConfirmBody", { name: groupName })}</DialogContentText>
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
          {t("cancel", { defaultValue: "Cancel" })}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isLoading}
          variant="contained"
          sx={theme => ({
            bgcolor: theme.palette.error.main,
            color: theme.palette.onError,
            fontWeight: 700,
            borderRadius: 1.5,
            "&:hover": {
              bgcolor: theme.palette.error.dark,
            },
          })}
        >
          {t("actionDelete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
