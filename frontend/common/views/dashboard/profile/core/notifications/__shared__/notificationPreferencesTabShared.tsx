"use client";

import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { AppSnackbar } from "@/frontend/common/components/ui/state";
import type { NotificationPreferencesTabVariantProps } from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes";
import type { ProfileNotificationsLabels } from "@/shared/locale/types/profile";

interface NotificationPreferencesTabSharedOptions {
  readonly renderBody: (props: Readonly<NotificationPreferencesTabVariantProps>) => ReactNode;
}

export interface NotificationPreferencesTabSharedProps {
  readonly variantProps: Readonly<NotificationPreferencesTabVariantProps>;
  readonly options: NotificationPreferencesTabSharedOptions;
}

export function NotificationPreferencesTabShared({
  variantProps,
  options,
}: Readonly<NotificationPreferencesTabSharedProps>) {
  const { labels, snackbarOpen, snackbarMessage, snackbarSeverity, onSnackbarClose, errorLoading } = variantProps;

  if (errorLoading) {
    return (
      <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.error.main }}>
        {labels.errorLoading}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <NotificationPreferencesTabHeader labels={labels} />
      {options.renderBody(variantProps)}
      <AppSnackbar
        state={{ open: snackbarOpen, message: snackbarMessage, severity: snackbarSeverity }}
        onClose={onSnackbarClose}
        autoHideDuration={4000}
      />
    </Box>
  );
}

function NotificationPreferencesTabHeader({ labels }: Readonly<{ readonly labels: ProfileNotificationsLabels }>) {
  return (
    <Box>
      <Typography sx={{ typography: "titleLg", mb: 1 }}>{labels.title}</Typography>
      <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
        {labels.description}
      </Typography>
    </Box>
  );
}
