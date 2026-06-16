"use client";

import { Box } from "@mui/material";
import type { Control, FieldErrors } from "react-hook-form";
import { BaseCard, PageContainer, PageHeader, PrimaryPageAction } from "@/frontend/components/ui";
import type { ComplaintsParentLabels } from "@/frontend/messages/types/dashboard/complaints/main";
import type { ParentComplaintRecord, ParentStudentOption } from "@/frontend/stores/parentComplaintsStore";
import { SubmissionSuccessBanner } from "@/frontend/views/dashboard/shared/SubmissionSuccessBanner";
import { ComplaintFormFields } from "./components/ComplaintFormFields";
import { ComplaintPolicyPanel } from "./components/ComplaintPolicyPanel";
import { ComplaintRecordCardList } from "./components/ComplaintRecordCardList";
import type { ComplaintFormData } from "./schemas/complaintFormSchema";

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
}: Readonly<ParentComplaintsMobileViewProps>) {
  return (
    <>
      {showSuccess ? (
        <Box sx={{ px: 2, pt: 1 }}>
          <SubmissionSuccessBanner message={labels.successMessage} onDismiss={onDismissSuccess} />
        </Box>
      ) : null}

      <PageContainer>
        <PageHeader title={labels.pageTitle} titleVariant="headlineMd" />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pb: 4 }}>
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
          />

          <ComplaintPolicyPanel labels={labels} />
        </Box>
      </PageContainer>
    </>
  );
}
