"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import { Box, Snackbar, Typography } from "@mui/material";

export interface FormSnackbarSharedProps {
  readonly open: boolean;
  readonly message: string;
  readonly onClose: () => void;
  readonly icon: SvgIconComponent;
  readonly severityColor: "error" | "primary";
  readonly component?: "alert" | "output";
}

export function FormSnackbarShared({
  open,
  message,
  onClose,
  icon: Icon,
  severityColor,
  component,
}: Readonly<FormSnackbarSharedProps>) {
  return (
    <Snackbar open={open} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} onClose={onClose}>
      <Box
        {...(component ? { component } : {})}
        sx={theme => ({
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 3,
          py: 1.5,
          borderRadius: 10,
          backgroundColor: theme.palette[severityColor].main,
          color: severityColor === "error" ? theme.palette.onError : theme.palette.onPrimary,
          boxShadow: theme.palette.shadow.card,
        })}
      >
        <Icon />
        <Typography sx={{ fontWeight: 700 }}>{message}</Typography>
      </Box>
    </Snackbar>
  );
}
