"use client";

import { Box } from "@mui/material";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { ParentComplaintsViewModel } from "@/frontend/common/views/dashboard/complaints/useParentComplaintsViewModel";
import { SubmissionSuccessBanner } from "@/frontend/common/views/dashboard/shared/SubmissionSuccessBanner";
import { MobileContentStack, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button";
import { MobileBaseCard } from "@/frontend/mobile/components/ui/card";
import { ComplaintFormFieldsMobile } from "@/frontend/mobile/views/dashboard/complaints/components/complaintFormFields.mobile";
import { ComplaintPolicyPanelMobile } from "@/frontend/mobile/views/dashboard/complaints/components/complaintPolicyPanel.mobile";
import { ComplaintRecordCardListMobile } from "@/frontend/mobile/views/dashboard/complaints/components/complaintRecordCardList.mobile";

export function ParentComplaintsMobileView({
  labels,
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
          <MobileBaseCard>
            <ComplaintFormFieldsMobile control={control} errors={errors} labels={labels} />
            <MobilePrimaryPageAction
              fullWidth
              disabled={!canSubmit || isSubmitting}
              onClick={onFormSubmit}
              sx={{ mt: 3, height: 56 }}
            >
              {labels.submit}
            </MobilePrimaryPageAction>
          </MobileBaseCard>

          <ComplaintRecordCardListMobile
            records={records}
            labels={labels}
            hasOlderRecords={hasOlderRecords}
            onLoadOlderRecords={onLoadOlderRecords}
            paginationOptions={
              totalCount !== undefined && onPageChange !== undefined
                ? buildServerPaginationOptions({
                    page: page ?? 0,
                    pageSize: pageSize ?? 10,
                    totalCount,
                    onPageChange,
                  })
                : false
            }
          />

          <ComplaintPolicyPanelMobile labels={labels} />
        </MobileContentStack>
      </MobilePageContainer>
    </>
  );
}
