"use client";

import { ErrorOutlined } from "@mui/icons-material";
import { Box, Snackbar, Typography } from "@mui/material";

export interface MobileFormErrorSnackbarProps {
  readonly open: boolean;
  readonly message: string;
  readonly onClose: () => void;
}

export function MobileFormErrorSnackbar({ open, message, onClose }: Readonly<MobileFormErrorSnackbarProps>) {
  return (
    <Snackbar open={open} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} onClose={onClose}>
      <Box
        {...{ component: "alert" }}
        sx={theme => ({
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2.5,
          py: 1.5,
          borderRadius: 10,
          backgroundColor: theme.palette.error.main,
          color: theme.palette.onError,
          boxShadow: theme.palette.shadow.card,
        })}
      >
        <ErrorOutlined />
        <Typography sx={{ fontWeight: 700, fontSize: "0.875rem" }}>{message}</Typography>
      </Box>
    </Snackbar>
  );
}
