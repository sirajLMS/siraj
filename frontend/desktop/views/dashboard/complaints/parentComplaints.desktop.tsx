"use client";

import { Grid } from "@mui/material";
import { BaseCard, PageContainer, PageHeader, PrimaryPageAction } from "@/frontend/common/components/ui";
import { ComplaintFormFields } from "@/frontend/common/views/dashboard/complaints/components/ComplaintFormFields";
import { ComplaintPolicyPanel } from "@/frontend/common/views/dashboard/complaints/components/ComplaintPolicyPanel";
import { ComplaintRecordCardList } from "@/frontend/common/views/dashboard/complaints/components/ComplaintRecordCardList";
import type { ParentComplaintsViewModel } from "@/frontend/common/views/dashboard/complaints/useParentComplaintsViewModel";
import { SubmissionSuccessBanner } from "@/frontend/common/views/dashboard/shared/SubmissionSuccessBanner";

export function ParentComplaintsDesktopView({
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
    <PageContainer>
      {showSuccess ? <SubmissionSuccessBanner message={labels.successMessage} onDismiss={onDismissSuccess} /> : null}

      <PageHeader title={labels.pageTitle} />

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <BaseCard>
            <ComplaintFormFields
              control={control}
              errors={errors}
              labels={labels}
              studentOptions={studentOptions}
              variant="desktop"
            />
            <PrimaryPageAction
              fullWidth
              disabled={!canSubmit || isSubmitting}
              onClick={onFormSubmit}
              sx={{ mt: 4, py: 2 }}
            >
              {labels.submit}
            </PrimaryPageAction>
          </BaseCard>
          <ComplaintPolicyPanel labels={labels} />
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
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
        </Grid>
      </Grid>
    </PageContainer>
  );
}
