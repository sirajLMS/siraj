"use client";

import { BarChartOutlined, ErrorOutlined, HourglassEmpty, WarningOutlined } from "@mui/icons-material";
import { Box, Paper, Typography } from "@mui/material";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

interface SupervisorQuotaViewProps {
  readonly t: StudentQuotaLabels;
}

export function SupervisorQuotaView({ t }: Readonly<SupervisorQuotaViewProps>) {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="titleLg" sx={{ mb: 2 }}>
        {t.audience.supervisorTitle}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Paper sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }} elevation={0} variant="outlined">
          <HourglassEmpty sx={{ color: "warning.main" }} />
          <Box>
            <Typography variant="labelMd">{t.audience.onDemandPendingQueue}</Typography>
            <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
              {t.audience.noData}
            </Typography>
          </Box>
        </Paper>
        <Paper sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }} elevation={0} variant="outlined">
          <WarningOutlined sx={{ color: "error.main" }} />
          <Box>
            <Typography variant="labelMd">{t.audience.conflictHeld}</Typography>
            <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
              {t.audience.noData}
            </Typography>
          </Box>
        </Paper>
        <Paper sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }} elevation={0} variant="outlined">
          <ErrorOutlined sx={{ color: "warning.main" }} />
          <Box>
            <Typography variant="labelMd">{t.audience.lowBalanceAlerts}</Typography>
            <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
              {t.audience.noData}
            </Typography>
          </Box>
        </Paper>
        <Paper sx={{ p: 3 }} elevation={0} variant="outlined">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <BarChartOutlined />
            <Typography variant="labelMd">{t.audience.analyticsOverview}</Typography>
          </Box>
          <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
            {t.audience.noData}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
