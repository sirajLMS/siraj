"use client";

import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { Control, FieldErrors } from "react-hook-form";
import { BaseCard, PageContainer, PageHeader, PrimaryPageAction } from "@/frontend/components/ui";
import { SubmissionSuccessBanner } from "@/frontend/views/dashboard/shared/SubmissionSuccessBanner";
import type { ComplaintsParentLabels } from "@/shared/messages/types/dashboard/complaints/main";
import { ComplaintFormFields } from "./components/ComplaintFormFields";
import { ComplaintPolicyPanel } from "./components/ComplaintPolicyPanel";
import { ComplaintRecordCardList } from "./components/ComplaintRecordCardList";
import type { ComplaintFormData } from "./schemas/complaintFormSchema";
import type { ParentComplaintRecord, ParentStudentOption } from "./types/complaints.types";

/** Mobile success banner wrapper with padding */
const StyledMobileSuccessBannerBox = styled(Box)(({ theme }) => ({
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  paddingTop: theme.spacing(1),
}));

/** Mobile view content column container with spacing */
const StyledMobileContentColumn = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
  paddingBottom: theme.spacing(4),
}));

interface ParentComplaintsMobileViewProps {
  readonly labels: ComplaintsParentLabels;
  readonly studentOptions: readonly ParentStudentOption[];
  readonly records: readonly ParentComplaintRecord[];
  readonly hasOlderRecords: boolean;
  readonly control: Control<ComplaintFormData>;
  readonly errors: FieldErrors<ComplaintFormData>;
  readonly isSubmitting: boolean;
  readonly showSuccess: boolean;
  readonly canSubmit: boolean;
  readonly onDismissSuccess: () => void;
  readonly onFormSubmit: () => void;
  readonly onLoadOlderRecords: () => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}

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
}: Readonly<ParentComplaintsMobileViewProps>) {
  return (
    <>
      {/* Success banner displayed at top of mobile view after form submission */}
      {showSuccess ? (
        <StyledMobileSuccessBannerBox>
          <SubmissionSuccessBanner message={labels.successMessage} onDismiss={onDismissSuccess} />
        </StyledMobileSuccessBannerBox>
      ) : null}

      <PageContainer>
        <PageHeader title={labels.pageTitle} titleVariant="headlineMd" />

        {/* Vertical stack containing form card, complaint history list, and policy panel */}
        <StyledMobileContentColumn>
          {/* Complaint form with student select, email, and details fields */}
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

          {/* List of past complaint records */}
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

          {/* Policy information panel shown below the form */}
          <ComplaintPolicyPanel labels={labels} />
        </StyledMobileContentColumn>
      </PageContainer>
    </>
  );
}
