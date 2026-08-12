"use client";

import { Alert, Box, Snackbar, Typography } from "@mui/material";
import type { ReactNode } from "react";
import type { NotificationPreferencesTabVariantProps } from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes";
import type { ProfileNotificationsLabels } from "@/shared/locale/types/profile";

export interface NotificationPreferencesTabSharedOptions {
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
      <NotificationPreferencesTabSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={onSnackbarClose}
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

function NotificationPreferencesTabSnackbar(props: {
  readonly open: boolean;
  readonly message: string;
  readonly severity: "success" | "error";
  readonly onClose: () => void;
}) {
  return (
    <Snackbar
      open={props.open}
      autoHideDuration={4000}
      onClose={props.onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert severity={props.severity} onClose={props.onClose} sx={{ width: "100%" }}>
        {props.message}
      </Alert>
    </Snackbar>
  );
}
