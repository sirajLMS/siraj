"use client";

import { WarningAmberOutlined } from "@mui/icons-material";
import { Alert, Box, Typography } from "@mui/material";
import type { MissedClassAlertBannerProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";
import { DismissAlertButtonMobile } from "@/frontend/mobile/views/dashboard/teachers/dashboard/components/dismissAlertButton.mobile";

/**
 * Mobile variant of the missed-class alert banner.
 * Mobile renders inline (not fixed) inside the page's edge-to-edge stack —
 * `fixed` is accepted for API parity but typically not used on mobile.
 *
 * The interactive dismiss action is isolated in a tiny client island
 * (`DismissAlertButtonMobile`) so the surrounding `<Alert>` + `<Typography>`
 * markup can be hoisted to a Server Component. The pure presentational
 * server entry point lives in `missedClassAlertBannerContent.mobile.tsx`;
 * this file remains `"use client"` because its direct parent
 * (`teacherDashboard.mobile.tsx`) is a Client Component and a Client
 * Component cannot import a Server Component. Once the upstream data flow
 * is refactored to a `React.cache()`-wrapped server fetch, the parent will
 * render the server content component directly and this client wrapper can
 * be deleted.
 *
 * The byte-identical inline `MissedClassAlertBannerMobileProps` interface
 * was deleted; both tiers import the shared `MissedClassAlertBannerProps`
 * declared once in
 * `frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps.ts`.
 * `onDismiss` is added as an optional extension rather than mutating the
 * shared interface, so the existing call site in `teacherDashboard.mobile.tsx`
 * keeps type-checking unchanged.
 */
export function MissedClassAlertBannerMobile({
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
      action={onDismiss ? <DismissAlertButtonMobile onDismiss={onDismiss} ariaLabel={labels.title} /> : undefined}
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
