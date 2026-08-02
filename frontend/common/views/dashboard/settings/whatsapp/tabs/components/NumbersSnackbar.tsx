"use client";

import { Alert, Snackbar } from "@mui/material";
import type { WhatsappSnackbarState } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";

export function NumbersSnackbar({
  state,
  onClose,
}: Readonly<{ readonly state: WhatsappSnackbarState; readonly onClose: () => void }>) {
  return (
    <Snackbar
      open={state.open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert severity={state.severity} onClose={onClose} variant="filled">
        {state.message}
      </Alert>
    </Snackbar>
  );
}
