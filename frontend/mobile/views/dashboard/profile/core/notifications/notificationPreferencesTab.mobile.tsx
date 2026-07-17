"use client";

import { Alert, Box, Snackbar, Typography } from "@mui/material";
import type { NotificationPreferencesTabVariantProps } from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes";
import { PreferencesChannelTabsMobileView } from "@/frontend/mobile/views/dashboard/profile/core/notifications/preferencesChannelTabs.mobile";
import { useAppTranslation } from "@/shared/locale";

export type NotificationPreferencesTabMobileProps = NotificationPreferencesTabVariantProps;

export function NotificationPreferencesTabMobile({
  preferences,
  onToggle,
  disabled,
  loading,
  snackbarOpen,
  snackbarMessage,
  snackbarSeverity,
  onSnackbarClose,
  errorLoading,
}: Readonly<NotificationPreferencesTabMobileProps>) {
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

      <PreferencesChannelTabsMobileView
        preferences={preferences}
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
