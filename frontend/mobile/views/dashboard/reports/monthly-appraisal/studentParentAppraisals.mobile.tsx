"use client";

import { Alert } from "@mui/material";
import type { StudentParentAppraisalViewModel } from "@/frontend/common/views/dashboard/reports/monthly-appraisal/student-parent/useStudentParentAppraisalViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui/container/page";
import { MobileAppraisalListBody } from "@/frontend/mobile/views/dashboard/reports/monthly-appraisal/studentParentAppraisalListBody.parts";

export function StudentParentAppraisalsMobileView({
  labels,
  appraisals,
  loading,
  error,
  onSelectAppraisal,
  onOpenFeedbackModal,
}: Readonly<StudentParentAppraisalViewModel>) {
  return (
    <MobilePageContainer>
      <MobilePageHeader title={labels.studentParentView.pageTitle} />

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {labels.errors.loadFailed}
        </Alert>
      ) : (
        <MobileAppraisalListBody
          labels={labels}
          appraisals={appraisals}
          loading={loading}
          onSelectAppraisal={onSelectAppraisal}
          onOpenFeedbackModal={onOpenFeedbackModal}
        />
      )}
    </MobilePageContainer>
  );
}
