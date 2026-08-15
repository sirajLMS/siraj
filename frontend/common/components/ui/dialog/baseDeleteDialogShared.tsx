"use client";

import { WarningAmberOutlined } from "@mui/icons-material";
import { Box, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import type {
  BaseDeleteDialogSharedProps,
  DeleteDialogSlotProps,
} from "@/frontend/common/components/ui/dialog/types/baseDeleteDialogShared.types";

type BaseDeleteDialogScaffoldProps = BaseDeleteDialogSharedProps & DeleteDialogSlotProps;

export function BaseDeleteDialogScaffold({
  open,
  onClose,
  onConfirm,
  isLoading,
  title,
  body,
  cancelLabel,
  confirmLabel,
  confirmSx,
  fullScreen,
  CancelActionButton,
  ConfirmActionButton,
}: Readonly<BaseDeleteDialogScaffoldProps>) {
  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} maxWidth="xs" fullWidth fullScreen={fullScreen}>
      <DialogTitle component="div" sx={{ pt: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Box
          sx={theme => ({
            width: 64,
            height: 64,
            borderRadius: "50%",
            backgroundColor: theme.palette.errorContainer,
            color: theme.palette.error.main,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2,
          })}
        >
          <WarningAmberOutlined sx={{ fontSize: 32 }} />
        </Box>
        <Typography variant="headlineMd">{title}</Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, textAlign: "center" })}>
          {body}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <CancelActionButton fullWidth onClick={onClose} disabled={isLoading} sx={{ py: 1.5 }}>
          {cancelLabel}
        </CancelActionButton>
        <ConfirmActionButton
          fullWidth
          onClick={onConfirm}
          disabled={isLoading}
          aria-busy={isLoading}
          sx={
            confirmSx ??
            (theme => ({
              py: 1.5,
              backgroundColor: theme.palette.error.main,
              color: theme.palette.onError,
              "&:hover": { backgroundColor: theme.palette.error.dark },
            }))
          }
        >
          {isLoading ? <CircularProgress size={20} sx={theme => ({ color: theme.palette.onError })} /> : confirmLabel}
        </ConfirmActionButton>
      </DialogActions>
    </Dialog>
  );
}
