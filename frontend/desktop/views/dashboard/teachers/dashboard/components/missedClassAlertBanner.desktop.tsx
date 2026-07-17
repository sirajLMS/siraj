"use client";

import { WarningAmberOutlined } from "@mui/icons-material";
import { Alert, Box, Typography } from "@mui/material";
import type { MissedClassAlert } from "@/frontend/common/stores/teacherDashboardTypes";
import type { TeacherDashboardLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";

interface MissedClassAlertBannerDesktopProps {
  readonly alert: MissedClassAlert;
  readonly labels: TeacherDashboardLabels["alert"];
  readonly fixed?: boolean;
}

/**
 * Desktop variant of the missed-class alert banner.
 * Defaults to `fixed` rendering semantics matching the desktop layout —
 * the banner pins to the top of the viewport above the page chrome when the
 * caller passes `fixed` (desktop's existing behavior).
 */
export function MissedClassAlertBannerDesktop({
  alert,
  labels,
  fixed = false,
}: Readonly<MissedClassAlertBannerDesktopProps>) {
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
