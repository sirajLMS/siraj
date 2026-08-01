"use client";

import { Paper, Typography } from "@mui/material";
import { QuotaAudienceCard } from "@/frontend/common/views/dashboard/students/quota/audience/QuotaAudienceCard";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

interface StudentQuotaViewProps {
  readonly t: StudentQuotaLabels;
}

export function StudentQuotaAudienceView({ t }: Readonly<StudentQuotaViewProps>) {
  return (
    <QuotaAudienceCard title={t.audience.studentTitle}>
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
    </QuotaAudienceCard>
  );
}
