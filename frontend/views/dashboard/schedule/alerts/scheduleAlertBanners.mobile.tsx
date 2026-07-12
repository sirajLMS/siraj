"use client";

import { WarningAmberOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { ScheduleAlert, ScheduleAlertType } from "@/frontend/views/dashboard/schedule/alerts/types";

interface ScheduleAlertBannersMobileProps {
  readonly alerts: readonly ScheduleAlert[];
  readonly labels: Record<ScheduleAlertType, string>;
}

export function ScheduleAlertBannersMobile({ alerts, labels }: ScheduleAlertBannersMobileProps) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: { xs: 3, md: 4 } }}>
      {alerts.map(alert => (
        <Box
          key={alert.id}
          sx={theme => ({
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
            p: 2,
            borderRadius: theme.layout.radius.card,
            backgroundColor: theme.palette.status.cancelledContainer,
            border: `1px solid ${theme.palette.status.cancelled}`,
            boxShadow: theme.palette.shadow.card,
          })}
        >
          <WarningAmberOutlined
            sx={theme => ({ flexShrink: 0, mt: 0.25, color: theme.palette.status.onCancelledContainer })}
          />
          <Typography
            variant="bodyMd"
            sx={theme => ({
              fontWeight: 700,
              color: theme.palette.status.onCancelledContainer,
            })}
          >
            {labels[alert.type]}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
