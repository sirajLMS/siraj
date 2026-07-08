"use client";

import { WarningAmberOutlined } from "@mui/icons-material";
import type { SxProps } from "@mui/material";
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { FilterButton, PrimaryPageAction } from "../button/ActionButtons";

export interface BaseDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  title: string;
  body: string;
  cancelLabel: string;
  confirmLabel: string;
  /** Optional override for the confirm button sx (default uses error palette) */
  confirmSx?: SxProps<Theme>;
}

export function BaseDeleteDialog({
  open,
  onClose,
  onConfirm,
  isLoading,
  title,
  body,
  cancelLabel,
  confirmLabel,
  confirmSx,
}: Readonly<BaseDeleteDialogProps>) {
  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pt: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
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
        <FilterButton fullWidth onClick={onClose} disabled={isLoading} sx={{ py: 1.5 }}>
          {cancelLabel}
        </FilterButton>
        <PrimaryPageAction
          fullWidth
          onClick={onConfirm}
          disabled={isLoading}
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
          {isLoading ? "..." : confirmLabel}
        </PrimaryPageAction>
      </DialogActions>
    </Dialog>
  );
}
