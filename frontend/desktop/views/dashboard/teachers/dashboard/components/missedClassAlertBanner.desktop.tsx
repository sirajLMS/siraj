"use client";

import { WarningAmberOutlined } from "@mui/icons-material";
import { Alert, Box, Typography } from "@mui/material";
import type { MissedClassAlertBannerProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";

/**
 * Desktop variant of the missed-class alert banner.
 * Defaults to `fixed` rendering semantics matching the desktop layout —
 * the banner pins to the top of the viewport above the page chrome when the
 * caller passes `fixed` (desktop's existing behavior).
 *
 * Plan v5: per specs.md §3 N15 + §4.1 Class B, the byte-identical inline
 * `MissedClassAlertBannerDesktopProps` interface was deleted; both tiers now
 * import the shared `MissedClassAlertBannerProps` declared once in
 * `frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps.ts`.
 */
export function MissedClassAlertBannerDesktop({ alert, labels, fixed = false }: Readonly<MissedClassAlertBannerProps>) {
  const description = labels.description(alert.classId, alert.scheduledTime);

  return (
    <Alert
      severity="error"
      icon={<WarningAmberOutlined />}
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
