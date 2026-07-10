"use client";

import { ErrorOutlined } from "@mui/icons-material";
import { Box, Snackbar, Typography } from "@mui/material";

interface FormErrorSnackbarProps {
  readonly open: boolean;
  readonly message: string;
  readonly onClose: () => void;
}

export function FormErrorSnackbar({ open, message, onClose }: Readonly<FormErrorSnackbarProps>) {
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
