"use client";

import { Box } from "@mui/material";
import {
  BaseCard,
  MobileContentStack,
  MobilePageHeader,
  PageContainer,
  PrimaryPageAction,
} from "@/frontend/components/ui";
import { ComplaintFormFields } from "@/frontend/views/dashboard/complaints/components/ComplaintFormFields";
import { ComplaintPolicyPanel } from "@/frontend/views/dashboard/complaints/components/ComplaintPolicyPanel";
import { ComplaintRecordCardList } from "@/frontend/views/dashboard/complaints/components/ComplaintRecordCardList";
import type { ParentComplaintsViewModel } from "@/frontend/views/dashboard/complaints/useParentComplaintsViewModel";
import { SubmissionSuccessBanner } from "@/frontend/views/dashboard/shared/SubmissionSuccessBanner";

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

      <PageContainer>
        <MobilePageHeader title={labels.pageTitle} edgeToEdge={false} />

        <MobileContentStack gap={3} paddingBottom={4}>
          <BaseCard>
            <ComplaintFormFields
              control={control}
              errors={errors}
              labels={labels}
              studentOptions={studentOptions}
              variant="mobile"
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

          <ComplaintRecordCardList
            records={records}
            labels={labels}
            hasOlderRecords={hasOlderRecords}
            onLoadOlderRecords={onLoadOlderRecords}
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={onPageChange}
          />

          <ComplaintPolicyPanel labels={labels} />
        </MobileContentStack>
      </PageContainer>
    </>
  );
}
