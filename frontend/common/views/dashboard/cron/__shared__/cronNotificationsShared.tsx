"use client";

import { Alert, Snackbar } from "@mui/material";
import type { ComponentType } from "react";
import type { CronNotificationState } from "@/frontend/common/views/dashboard/cron/types";

export interface CronNotificationsSharedConfig {
  readonly FormErrorSnackbar: ComponentType<
    Readonly<{ readonly open: boolean; readonly message: string; readonly onClose: () => void }>
  >;
  readonly FormSuccessSnackbar: ComponentType<
    Readonly<{ readonly open: boolean; readonly message: string; readonly onClose: () => void }>
  >;
}

export function CronNotificationsShared({
  notifications,
  config,
}: Readonly<{
  readonly notifications: CronNotificationState;
  readonly config: Readonly<CronNotificationsSharedConfig>;
}>) {
  const { FormErrorSnackbar, FormSuccessSnackbar } = config;
  return (
    <>
      <FormErrorSnackbar
        open={notifications.errorOpen}
        message={notifications.errorMsg}
        onClose={notifications.closeError}
      />
      <FormSuccessSnackbar
        open={notifications.successOpen}
        message={notifications.successMsg}
        onClose={notifications.closeSuccess}
      />
      <Snackbar
        open={notifications.infoOpen}
        autoHideDuration={6000}
        onClose={notifications.closeInfo}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="info" onClose={notifications.closeInfo} sx={{ width: "100%" }}>
          {notifications.infoMsg}
        </Alert>
      </Snackbar>
    </>
  );
}
