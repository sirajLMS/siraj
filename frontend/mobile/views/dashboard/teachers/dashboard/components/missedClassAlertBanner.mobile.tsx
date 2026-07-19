"use client";

import { WarningAmberOutlined } from "@mui/icons-material";
import { Alert, Box, Typography } from "@mui/material";
import type { MissedClassAlertBannerProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";

/**
 * Mobile variant of the missed-class alert banner.
 * Mobile renders inline (not fixed) inside the page's edge-to-edge stack —
 * `fixed` is accepted for API parity but typically not used on mobile.
 *
 * Plan v5: per specs.md §3 N15 + §4.1 Class B, the byte-identical inline
 * `MissedClassAlertBannerMobileProps` interface was deleted; both tiers now
 * import the shared `MissedClassAlertBannerProps` declared once in
 * `frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps.ts`.
 */
export function MissedClassAlertBannerMobile({ alert, labels, fixed = false }: Readonly<MissedClassAlertBannerProps>) {
  const description = labels.description(alert.scheduledTime);

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
