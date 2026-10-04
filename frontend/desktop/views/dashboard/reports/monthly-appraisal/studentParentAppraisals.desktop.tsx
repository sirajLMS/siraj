"use client";

import { RateReviewOutlined } from "@mui/icons-material";
import { Alert, Box, Card, CardContent, Stack, Typography } from "@mui/material";
import type {
  MonthlyAppraisalRow,
  StudentParentAppraisalViewModel,
} from "@/frontend/common/views/dashboard/reports/monthly-appraisal/student-parent/useStudentParentAppraisalViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { AppraisalCard } from "@/frontend/desktop/views/dashboard/reports/monthly-appraisal/studentParentAppraisalCard.parts";

interface DesktopAppraisalListBodyProps {
  readonly labels: StudentParentAppraisalViewModel["labels"];
  readonly appraisals: readonly MonthlyAppraisalRow[];
  readonly loading: boolean;
  readonly onSelectAppraisal: (id: string) => void;
  readonly onOpenFeedbackModal: () => void;
}

function AppraisalListBody({
  labels,
  appraisals,
  loading,
  onSelectAppraisal,
  onOpenFeedbackModal,
}: Readonly<DesktopAppraisalListBodyProps>) {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <Typography variant="body2" sx={theme => ({ color: theme.palette.text.secondary })}>
          Loading...
        </Typography>
      </Box>
    );
  }
  if (appraisals.length === 0) {
    return (
      <Card variant="outlined" sx={{ borderStyle: "dashed", borderRadius: 3 }}>
        <CardContent sx={{ textAlign: "center", py: 6, px: 3 }}>
          <RateReviewOutlined sx={theme => ({ fontSize: 56, color: theme.palette.text.disabled, mb: 2 })} />
          <Typography variant="h6" sx={theme => ({ color: theme.palette.text.primary, fontWeight: 600 })}>
            {labels.studentParentView.emptyState}
          </Typography>
          <Typography
            variant="body2"
            sx={theme => ({ color: theme.palette.text.secondary, mt: 1, maxWidth: 420, mx: "auto" })}
          >
            {labels.studentParentView.emptyStateDescription}
          </Typography>
        </CardContent>
      </Card>
    );
  }
  return (
    <Stack spacing={3}>
      {appraisals.map(a => (
        <AppraisalCard
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

export function StudentParentAppraisalsDesktopView({
  labels,
  appraisals,
  loading,
  error,
  onSelectAppraisal,
  onOpenFeedbackModal,
}: Readonly<StudentParentAppraisalViewModel>) {
  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.studentParentView.pageTitle} subtitle={labels.studentParentView.pageSubtitle} />

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {labels.errors.loadFailed}
        </Alert>
      ) : (
        <AppraisalListBody
          labels={labels}
          appraisals={appraisals}
          loading={loading}
          onSelectAppraisal={onSelectAppraisal}
          onOpenFeedbackModal={onOpenFeedbackModal}
        />
      )}
    </DesktopPageContainer>
  );
}
