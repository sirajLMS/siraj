"use client";

import { CheckCircleOutlined } from "@mui/icons-material";
import { Box, Snackbar, Typography } from "@mui/material";

interface FormSuccessSnackbarProps {
  readonly open: boolean;
  readonly message: string;
  readonly onClose: () => void;
}

export function FormSuccessSnackbar({ open, message, onClose }: Readonly<FormSuccessSnackbarProps>) {
  return (
    <Snackbar open={open} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} onClose={onClose}>
      <Box
        sx={theme => ({
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 3,
          py: 1.5,
          borderRadius: 10,
          bgcolor: theme.palette.primary.main,
          color: theme.palette.onPrimary,
          boxShadow: theme.palette.shadow.card,
        })}
      >
        <CheckCircleOutlined />
        <Typography sx={{ fontWeight: 700 }}>{message}</Typography>
      </Box>
    </Snackbar>
  );
}
