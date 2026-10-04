"use client";

import { Box, Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";
import type {
  MonthlyAppraisalRow,
  StudentParentAppraisalViewModel,
} from "@/frontend/common/views/dashboard/reports/monthly-appraisal/student-parent/useStudentParentAppraisalViewModel";
import { MobileAppraisalCard } from "@/frontend/mobile/views/dashboard/reports/monthly-appraisal/studentParentAppraisalCard.parts";

interface MobileAppraisalListBodyProps {
  labels: StudentParentAppraisalViewModel["labels"];
  appraisals: readonly MonthlyAppraisalRow[];
  loading: boolean;
  onSelectAppraisal: (id: string) => void;
  onOpenFeedbackModal: () => void;
}

export function MobileAppraisalListBody({
  labels,
  appraisals,
  loading,
  onSelectAppraisal,
  onOpenFeedbackModal,
}: Readonly<MobileAppraisalListBodyProps>) {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }
  if (appraisals.length === 0) {
    return (
      <Card variant="outlined" sx={{ borderStyle: "dashed" }}>
        <CardContent sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="subtitle2" sx={theme => ({ color: theme.palette.text.secondary })}>
            {labels.studentParentView.emptyState}
          </Typography>
          <Typography variant="caption" sx={theme => ({ color: theme.palette.text.disabled, mt: 0.5 })}>
            {labels.studentParentView.emptyStateDescription}
          </Typography>
        </CardContent>
      </Card>
    );
  }
  return (
    <Stack spacing={1.5}>
      {appraisals.map(a => (
        <MobileAppraisalCard
          key={a.id}
          appraisal={a}
          labels={labels}
          onOpenFeedback={() => {
            onSelectAppraisal(a.id);
            onOpenFeedbackModal();
          }}
        />
      ))}
    </Stack>
  );
}
