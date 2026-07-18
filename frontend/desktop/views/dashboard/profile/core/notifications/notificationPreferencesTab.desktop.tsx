"use client";

import { Alert, Box, Snackbar, Typography } from "@mui/material";
import type { NotificationPreferencesTabVariantProps } from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes";
import { PreferencesMatrixDesktopView } from "@/frontend/desktop/views/dashboard/profile/core/notifications/preferencesMatrix.desktop";
import { useAppTranslation } from "@/shared/locale";

export function NotificationPreferencesTabDesktop({
  matrixRows,
  onToggle,
  disabled,
  loading,
  snackbarOpen,
  snackbarMessage,
  snackbarSeverity,
  onSnackbarClose,
  errorLoading,
}: Readonly<NotificationPreferencesTabVariantProps>) {
  const t = useAppTranslation().profileTranslations.notifications;

  if (errorLoading) {
    return (
      <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.error.main }}>{t.errorLoading}</Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography sx={{ typography: "titleLg", mb: 1 }}>{t.title}</Typography>
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
          {t.description}
        </Typography>
      </Box>

      <PreferencesMatrixDesktopView
        matrixRows={matrixRows ?? []}
        onToggle={onToggle}
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
