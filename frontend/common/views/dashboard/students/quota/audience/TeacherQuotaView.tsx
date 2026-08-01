"use client";

import { WarningAmberOutlined } from "@mui/icons-material";
import { Box, Paper, Typography } from "@mui/material";
import { QuotaAudienceCard } from "@/frontend/common/views/dashboard/students/quota/audience/QuotaAudienceCard";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

interface TeacherQuotaViewProps {
  readonly t: StudentQuotaLabels;
}

export function TeacherQuotaView({ t }: Readonly<TeacherQuotaViewProps>) {
  return (
    <QuotaAudienceCard title={t.audience.teacherTitle}>
      <Paper sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }} elevation={0} variant="outlined">
        <WarningAmberOutlined sx={{ color: "error.main" }} />
        <Box>
          <Typography variant="labelMd">{t.audience.conflictHeld}</Typography>
          <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
            {t.audience.noData}
          </Typography>
        </Box>
      </Paper>
      <Paper sx={{ p: 3 }} elevation={0} variant="outlined">
        <Typography variant="labelMd" sx={{ mb: 1 }}>
          {t.audience.classQuotaUsage}
        </Typography>
        <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
          {t.audience.noData}
        </Typography>
      </Paper>
      <Paper sx={{ p: 3 }} elevation={0} variant="outlined">
        <Typography variant="labelMd" sx={{ mb: 1 }}>
          {t.audience.onDemandPendingQueue}
        </Typography>
        <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
          {t.audience.noData}
        </Typography>
      </Paper>
      <Paper sx={{ p: 3 }} elevation={0} variant="outlined">
        <Typography variant="labelMd" sx={{ mb: 1 }}>
          {t.audience.classAnalytics}
        </Typography>
        <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
          {t.audience.noData}
        </Typography>
      </Paper>
    </QuotaAudienceCard>
  );
}
