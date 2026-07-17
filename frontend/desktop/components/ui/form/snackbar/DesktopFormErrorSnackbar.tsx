"use client";

import { ErrorOutlined } from "@mui/icons-material";
import { Box, Snackbar, Typography } from "@mui/material";

export interface DesktopFormErrorSnackbarProps {
  readonly open: boolean;
  readonly message: string;
  readonly onClose: () => void;
}

export function DesktopFormErrorSnackbar({ open, message, onClose }: Readonly<DesktopFormErrorSnackbarProps>) {
  return (
    <Snackbar open={open} anchorOrigin={{ vertical: "top", horizontal: "right" }} onClose={onClose}>
      <Box
        sx={theme => ({
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 3,
          py: 1.5,
          borderRadius: 10,
          backgroundColor: theme.palette.error.main,
          color: theme.palette.onError,
          boxShadow: theme.palette.shadow.card,
        })}
      >
        <ErrorOutlined />
        <Typography sx={{ fontWeight: 700 }}>{message}</Typography>
      </Box>
    </Snackbar>
  );
}
