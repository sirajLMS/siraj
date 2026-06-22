"use client";

import { Grid } from "@mui/material";
import type { Control, FieldErrors } from "react-hook-form";
import { BaseCard, PageContainer, PageHeader, PrimaryPageAction } from "@/frontend/components/ui";
import type { ParentComplaintRecord, ParentStudentOption } from "@/frontend/stores/mockParentComplaintsStore";
import { SubmissionSuccessBanner } from "@/frontend/views/dashboard/shared/SubmissionSuccessBanner";
import type { ComplaintsParentLabels } from "@/shared/messages/types/dashboard/complaints/main";
import { ComplaintFormFields } from "./components/ComplaintFormFields";
import { ComplaintPolicyPanel } from "./components/ComplaintPolicyPanel";
import { ComplaintRecordCardList } from "./components/ComplaintRecordCardList";
import type { ComplaintFormData } from "./schemas/complaintFormSchema";

interface ParentComplaintsDesktopViewProps {
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
}

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
}: Readonly<ParentComplaintsDesktopViewProps>) {
  return (
    <PageContainer>
      {/* Success banner shown after complaint submission */}
      {showSuccess ? <SubmissionSuccessBanner message={labels.successMessage} onDismiss={onDismissSuccess} /> : null}

      <PageHeader title={labels.pageTitle} />

      <Grid container spacing={4}>
        {/* Left column: complaint form and policy information */}
        <Grid size={{ xs: 12, lg: 5 }}>
          {/* Complaint form card with student select, email, and details fields */}
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
          {/* Policy information panel shown below the form card */}
          <ComplaintPolicyPanel labels={labels} />
        </Grid>

        {/* Right column: list of past complaint records */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <ComplaintRecordCardList
            records={records}
            labels={labels}
            hasOlderRecords={hasOlderRecords}
            onLoadOlderRecords={onLoadOlderRecords}
          />
        </Grid>
      </Grid>
    </PageContainer>
  );
}
