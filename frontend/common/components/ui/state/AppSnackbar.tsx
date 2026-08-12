"use client";

import { Alert, Snackbar } from "@mui/material";
import type * as React from "react";
import type { AppSnackbarState } from "@/frontend/common/components/ui/state/appSnackbar.types";

export interface AppSnackbarProps {
  readonly state: AppSnackbarState;
  readonly onClose: () => void;
  readonly autoHideDuration?: number;
}

export function AppSnackbar({ state, onClose, autoHideDuration = 4000 }: Readonly<AppSnackbarProps>): React.ReactNode {
  return (
    <Snackbar
      open={state.open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert severity={state.severity} onClose={onClose} variant="filled">
        {state.message}
      </Alert>
    </Snackbar>
  );
}
