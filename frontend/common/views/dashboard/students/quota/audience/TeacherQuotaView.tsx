"use client";

import { Paper, Typography } from "@mui/material";
import { QuotaAudienceCard } from "@/frontend/common/views/dashboard/students/quota/audience/QuotaAudienceCard";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

interface TeacherQuotaViewProps {
  readonly t: StudentQuotaLabels;
}

export function TeacherQuotaView({ t }: Readonly<TeacherQuotaViewProps>) {
  return (
    <QuotaAudienceCard title={t.audience.teacherTitle}>
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
