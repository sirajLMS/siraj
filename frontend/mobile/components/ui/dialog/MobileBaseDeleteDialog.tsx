"use client";

import { WarningAmberOutlined } from "@mui/icons-material";
import type { SxProps } from "@mui/material";
import { Box, Dialog, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { MobileFilterButton, MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button";

export interface MobileBaseDeleteDialogProps {
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

export function MobileBaseDeleteDialog({
  open,
  onClose,
  onConfirm,
  isLoading,
  title,
  body,
  cancelLabel,
  confirmLabel,
  confirmSx,
}: Readonly<MobileBaseDeleteDialogProps>) {
  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      fullScreen
      maxWidth={false}
      sx={{ display: "flex", flexDirection: "column" }}
    >
      <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <WarningAmberOutlined sx={{ fontSize: 28, color: (theme: Theme) => theme.palette.error.main }} />
        <MobileFilterButton onClick={onClose} disabled={isLoading}>
          {cancelLabel}
        </MobileFilterButton>
      </Box>
      <Box
        sx={{
          p: 3,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          alignItems: "center",
          flex: 1,
        }}
      >
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
          })}
        >
          <WarningAmberOutlined sx={{ fontSize: 32 }} />
        </Box>
        <Typography variant="headlineMd">{title}</Typography>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, textAlign: "center" })}>
          {body}
        </Typography>
      </Box>
      <Box
        sx={{
          p: 2,
          position: "sticky",
          bottom: 0,
          backgroundColor: (theme: Theme) => theme.palette.surfaceContainer,
        }}
      >
        <MobilePrimaryPageAction
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
        </MobilePrimaryPageAction>
      </Box>
    </Dialog>
  );
}
