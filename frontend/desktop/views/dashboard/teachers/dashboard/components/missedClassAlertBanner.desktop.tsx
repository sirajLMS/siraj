"use client";

import { WarningAmberOutlined } from "@mui/icons-material";
import { Alert, Box, Typography } from "@mui/material";
import type { MissedClassAlertBannerProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";
import { DismissAlertButtonDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/dismissAlertButton.desktop";

/**
 * Desktop variant of the missed-class alert banner.
 * Defaults to `fixed` rendering semantics matching the desktop layout —
 * the banner pins to the top of the viewport above the page chrome when the
 * caller passes `fixed` (desktop's existing behavior).
 *
 * The interactive dismiss action is isolated in a tiny client island
 * (`DismissAlertButtonDesktop`) so the surrounding `<Alert>` + `<Typography>`
 * markup can be hoisted to a Server Component. The pure presentational
 * server entry point lives in `missedClassAlertBannerContent.desktop.tsx`;
 * this file remains `"use client"` because its direct parent
 * (`teacherDashboard.desktop.tsx`) is a Client Component and a Client
 * Component cannot import a Server Component. Once the upstream data flow
 * is refactored to a `React.cache()`-wrapped server fetch, the parent will
 * render the server content component directly and this client wrapper can
 * be deleted.
 *
 * The byte-identical inline `MissedClassAlertBannerDesktopProps` interface
 * was deleted; both tiers import the shared `MissedClassAlertBannerProps`
 * declared once in
 * `frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps.ts`.
 */
export function MissedClassAlertBannerDesktop({
  alert,
  labels,
  fixed = false,
  onDismiss,
}: Readonly<MissedClassAlertBannerProps & { onDismiss?: () => void }>) {
  const description = labels.description(alert.scheduledTime);

  return (
    <Alert
      severity="error"
      icon={<WarningAmberOutlined />}
      action={onDismiss ? <DismissAlertButtonDesktop onDismiss={onDismiss} ariaLabel={labels.title} /> : undefined}
      sx={theme => ({
        mb: 3,
        ...(fixed
          ? {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              zIndex: theme.zIndex.appBar + 2,
              borderRadius: 0,
            }
          : {}),
      })}
    >
      <Box>
        <Typography sx={{ typography: "labelUppercase", fontWeight: 700 }}>{labels.title}</Typography>
        <Typography sx={{ typography: "bodyMd", mt: 0.5 }}>{description}</Typography>
      </Box>
    </Alert>
  );
}
