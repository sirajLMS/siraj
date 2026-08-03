"use client";

import { BarChartOutlined, ErrorOutlined, HourglassEmptyOutlined, WarningOutlined } from "@mui/icons-material";
import { Box, Paper, Typography } from "@mui/material";
import { QuotaAudienceCard } from "@/frontend/common/views/dashboard/students/quota/audience/QuotaAudienceCard";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

interface SupervisorQuotaViewProps {
  readonly t: StudentQuotaLabels;
}

export function SupervisorQuotaView({ t }: Readonly<SupervisorQuotaViewProps>) {
  return (
    <QuotaAudienceCard title={t.audience.supervisorTitle}>
      <Paper sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }} elevation={0} variant="outlined">
        <HourglassEmptyOutlined sx={{ color: "warning.main" }} />
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
        <ErrorOutlined sx={{ color: "error.main" }} />
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
    </QuotaAudienceCard>
  );
}
