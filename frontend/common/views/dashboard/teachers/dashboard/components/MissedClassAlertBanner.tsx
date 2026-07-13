"use client";

import { WarningAmberOutlined } from "@mui/icons-material";
import { Alert, Box, Typography } from "@mui/material";
import type { MissedClassAlert } from "@/frontend/common/stores/teacherDashboardTypes";
import type { TeacherDashboardLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";

interface MissedClassAlertBannerProps {
  readonly alert: MissedClassAlert;
  readonly labels: TeacherDashboardLabels["alert"];
  readonly fixed?: boolean;
}

export function MissedClassAlertBanner({ alert, labels, fixed = false }: Readonly<MissedClassAlertBannerProps>) {
  const description = labels.description.replace("{classId}", alert.classId).replace("{time}", alert.scheduledTime);

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
