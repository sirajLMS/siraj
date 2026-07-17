"use client";

import { Grid } from "@mui/material";
import { BaseCard, PrimaryPageAction } from "@/frontend/common/components/ui";
import type { ParentComplaintsViewModel } from "@/frontend/common/views/dashboard/complaints/useParentComplaintsViewModel";
import { SubmissionSuccessBanner } from "@/frontend/common/views/dashboard/shared/SubmissionSuccessBanner";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { ComplaintFormFieldsDesktop } from "@/frontend/desktop/views/dashboard/complaints/components/complaintFormFields.desktop";
import { ComplaintPolicyPanelDesktop } from "@/frontend/desktop/views/dashboard/complaints/components/complaintPolicyPanel.desktop";
import { ComplaintRecordCardListDesktop } from "@/frontend/desktop/views/dashboard/complaints/components/complaintRecordCardList.desktop";

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
    <DesktopPageContainer>
      {showSuccess ? <SubmissionSuccessBanner message={labels.successMessage} onDismiss={onDismissSuccess} /> : null}

      <DesktopPageHeader title={labels.pageTitle} />

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <BaseCard>
            <ComplaintFormFieldsDesktop
              control={control}
              errors={errors}
              labels={labels}
              studentOptions={studentOptions}
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
          <ComplaintPolicyPanelDesktop labels={labels} />
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <ComplaintRecordCardListDesktop
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
    </DesktopPageContainer>
  );
}
