"use client";

import { ReportOutlined, TimerOffOutlined, WarningAmberOutlined } from "@mui/icons-material";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import type { ScheduleAlert, ScheduleAlertType } from "@/frontend/views/dashboard/schedule/alerts/types";

interface ScheduleAlertBannersProps {
  readonly alerts: readonly ScheduleAlert[];
  readonly labels: Record<ScheduleAlertType, string>;
}

const ALERT_ICONS: Record<ScheduleAlertType, typeof ReportOutlined> = {
  leave_quota_exceeded: ReportOutlined,
  missed_class_time: TimerOffOutlined,
};

export function ScheduleAlertBanners({ alerts, labels }: ScheduleAlertBannersProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (alerts.length === 0) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: isMobile ? 1.5 : 2, mb: { xs: 3, md: 4 } }}>
      {alerts.map(alert => {
        const Icon = isMobile ? WarningAmberOutlined : ALERT_ICONS[alert.type];

        if (isMobile) {
          return (
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
              <Icon sx={theme => ({ flexShrink: 0, mt: 0.25, color: theme.palette.status.onCancelledContainer })} />
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
          );
        }

        return (
          <Box
            key={alert.id}
            sx={theme => ({
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 2,
              backgroundColor: theme.palette.status.cancelledContainer,
              borderLeft: `4px solid ${theme.palette.status.cancelled}`,
              borderRadius: "0 12px 12px 0",
              animation: alert.pulse ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none",
              "@keyframes pulse": {
                "0%, 100%": { opacity: 1 },
                "50%": { opacity: 0.85 },
              },
            })}
          >
            <Icon sx={theme => ({ color: theme.palette.status.onCancelledContainer, flexShrink: 0 })} />
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
        );
      })}
    </Box>
  );
}
