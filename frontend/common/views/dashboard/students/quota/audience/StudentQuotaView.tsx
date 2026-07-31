"use client";

import { Box, Paper, Typography } from "@mui/material";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

interface StudentQuotaViewProps {
  readonly t: StudentQuotaLabels;
}

export function StudentQuotaAudienceView({ t }: Readonly<StudentQuotaViewProps>) {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="titleLg" sx={{ mb: 2 }}>
        {t.audience.studentTitle}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Paper sx={{ p: 3 }} elevation={0} variant="outlined">
          <Typography variant="labelMd" sx={{ mb: 1 }}>
            {t.audience.activeQuotas}
          </Typography>
          <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
            {t.audience.noData}
          </Typography>
        </Paper>
        <Paper sx={{ p: 3 }} elevation={4} variant="outlined">
          <Typography variant="labelMd" sx={{ mb: 1 }}>
            {t.audience.remainingCredits}
          </Typography>
          <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
            {t.audience.noData}
          </Typography>
        </Paper>
        <Paper sx={{ p: 3 }} elevation={4} variant="outlined">
          <Typography variant="labelMd" sx={{ mb: 1 }}>
            {t.audience.onDemandPending}
          </Typography>
          <Typography variant="bodyMd" sx={{ color: "text.secondary" }}>
            {t.audience.noData}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
