"use client";

import { Box, Paper, Typography } from "@mui/material";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

interface TeacherQuotaViewProps {
  readonly t: StudentQuotaLabels;
}

export function TeacherQuotaView({ t }: Readonly<TeacherQuotaViewProps>) {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="titleLg" sx={{ mb: 2 }}>
        {t.audience.teacherTitle}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
      </Box>
    </Box>
  );
}
