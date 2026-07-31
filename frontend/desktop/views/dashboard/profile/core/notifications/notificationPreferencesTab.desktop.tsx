"use client";

import { Alert, Box, Snackbar, Typography } from "@mui/material";
import type { NotificationPreferencesTabVariantProps } from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes";
import { PreferencesMatrixDesktopView } from "@/frontend/desktop/views/dashboard/profile/core/notifications/preferencesMatrix.desktop";

export function NotificationPreferencesTabDesktop({
  labels,
  matrixRows,
  categoryRows,
  onToggle,
  onCategoryToggle,
  disabled,
  loading,
  snackbarOpen,
  snackbarMessage,
  snackbarSeverity,
  onSnackbarClose,
  errorLoading,
}: Readonly<NotificationPreferencesTabVariantProps>) {
  if (errorLoading) {
    return (
      <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.error.main }}>
        {labels.errorLoading}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography sx={{ typography: "titleLg", mb: 1 }}>{labels.title}</Typography>
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
          {labels.description}
        </Typography>
      </Box>

      <PreferencesMatrixDesktopView
        labels={labels}
        matrixRows={matrixRows ?? []}
        categoryRows={categoryRows}
        onToggle={onToggle}
        onCategoryToggle={onCategoryToggle}
        disabled={disabled}
        loading={loading}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={onSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbarSeverity} onClose={onSnackbarClose} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
