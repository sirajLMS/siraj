"use client";

import { Alert, Box, Snackbar, Typography } from "@mui/material";
import { NotificationChannel } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { NotificationPreferencesTabVariantProps } from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes";
import { PreferencesChannelTabsMobileView } from "@/frontend/mobile/views/dashboard/profile/core/notifications/preferencesChannelTabs.mobile";

export function NotificationPreferencesTabMobile({
  labels,
  preferences,
  preferenceMap,
  eventTypes,
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
  activeChannel,
  slideDirection,
  onChannelChange,
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

      <PreferencesChannelTabsMobileView
        labels={labels}
        preferences={preferences}
        preferenceMap={preferenceMap ?? new Map()}
        eventTypes={eventTypes}
        categoryRows={categoryRows}
        onToggle={onToggle}
        onCategoryToggle={onCategoryToggle}
        disabled={disabled}
        loading={loading}
        activeChannel={activeChannel ?? NotificationChannel.Email}
        slideDirection={slideDirection ?? "left"}
        onChannelChange={onChannelChange ?? (() => undefined)}
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
