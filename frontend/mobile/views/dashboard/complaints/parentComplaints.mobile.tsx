"use client";

import { Box } from "@mui/material";
import { BaseCard, PrimaryPageAction } from "@/frontend/common/components/ui";
import type { ParentComplaintsViewModel } from "@/frontend/common/views/dashboard/complaints/useParentComplaintsViewModel";
import { SubmissionSuccessBanner } from "@/frontend/common/views/dashboard/shared/SubmissionSuccessBanner";
import { MobileContentStack, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { ComplaintFormFieldsMobile } from "@/frontend/mobile/views/dashboard/complaints/components/complaintFormFields.mobile";
import { ComplaintPolicyPanelMobile } from "@/frontend/mobile/views/dashboard/complaints/components/complaintPolicyPanel.mobile";
import { ComplaintRecordCardListMobile } from "@/frontend/mobile/views/dashboard/complaints/components/complaintRecordCardList.mobile";

export function ParentComplaintsMobileView({
  labels,
  studentOptions,
  records,
  hasOlderRecords,
  control,
  errors,
  isSubmitting,
  showSuccess,
  canSubmit,
  onDismissSuccess,
  onFormSubmit,
  onLoadOlderRecords,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: Readonly<ParentComplaintsViewModel>) {
  return (
    <>
      {showSuccess ? (
        <Box sx={{ px: 2, pt: 1 }}>
          <SubmissionSuccessBanner message={labels.successMessage} onDismiss={onDismissSuccess} />
        </Box>
      ) : null}

      <MobilePageContainer>
        <MobilePageHeader title={labels.pageTitle} edgeToEdge={false} />

        <MobileContentStack gap={3} paddingBottom={4}>
          <BaseCard>
            <ComplaintFormFieldsMobile
              control={control}
              errors={errors}
              labels={labels}
              studentOptions={studentOptions}
            />
            <PrimaryPageAction
              fullWidth
              disabled={!canSubmit || isSubmitting}
              onClick={onFormSubmit}
              sx={{ mt: 3, height: 56 }}
            >
              {labels.submit}
            </PrimaryPageAction>
          </BaseCard>

          <ComplaintRecordCardListMobile
            records={records}
            labels={labels}
            hasOlderRecords={hasOlderRecords}
            onLoadOlderRecords={onLoadOlderRecords}
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={onPageChange}
          />

          <ComplaintPolicyPanelMobile labels={labels} />
        </MobileContentStack>
      </MobilePageContainer>
    </>
  );
}
