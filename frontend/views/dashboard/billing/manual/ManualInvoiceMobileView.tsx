"use client";

import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { Control, FieldErrors } from "react-hook-form";
import { BaseCard, PageContainer, PageHeader } from "@/frontend/components/ui";
import type { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { BillingMonthSelector } from "@/frontend/views/dashboard/billing/manual/components/BillingMonthSelector";
import { InvoiceDraftSummaryCard } from "@/frontend/views/dashboard/billing/manual/components/InvoiceDraftSummaryCard";
import { ManualInvoiceActions } from "@/frontend/views/dashboard/billing/manual/components/ManualInvoiceActions";
import { ManualInvoiceFormFields } from "@/frontend/views/dashboard/billing/manual/components/ManualInvoiceFormFields";
import type { ManualInvoiceFormData } from "@/frontend/views/dashboard/billing/manual/schemas/manualInvoiceSchema";
import type {
  ParentInvoiceOption,
  StudentOption,
} from "@/frontend/views/dashboard/billing/manual/types/manualInvoiceViewTypes";
import type { BillingManualLabels } from "@/shared/messages/types/dashboard/billing/manual";

const StyledFormFieldset = styled("fieldset")(({ theme }) => ({
  border: 0,
  margin: 0,
  padding: 0,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  paddingBottom: theme.spacing(12),
  "&:disabled": {
    opacity: theme.palette.action.disabledOpacity,
    pointerEvents: "none",
  },
}));

interface ManualInvoiceMobileViewProps {
  readonly labels: BillingManualLabels;
  readonly parentOptions: readonly ParentInvoiceOption[];
  readonly studentOptions: readonly StudentOption[];
  readonly control: Control<ManualInvoiceFormData>;
  readonly errors: FieldErrors<ManualInvoiceFormData>;
  readonly totalFormatted: string;
  readonly draftCurrency: CurrencyCode;
  readonly canCreate: boolean;
  readonly canSendEmail: boolean;
  readonly isSubmitting: boolean;
  readonly parentsLoading: boolean;
  readonly studentsLoading: boolean;
  readonly onSubmitClick: () => void;
  readonly onSubmitAndSendEmailClick: () => void;
}

export function ManualInvoiceMobileView({
  labels,
  parentOptions,
  studentOptions,
  control,
  errors,
  totalFormatted,
  draftCurrency,
  canCreate,
  canSendEmail,
  isSubmitting,
  parentsLoading,
  studentsLoading,
  onSubmitClick,
  onSubmitAndSendEmailClick,
}: Readonly<ManualInvoiceMobileViewProps>) {
  return (
    <PageContainer>
      <PageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} titleVariant="headlineMd" />

      <Box
        component="form"
        onSubmit={event => {
          event.preventDefault();
        }}
      >
        <StyledFormFieldset disabled={!canCreate}>
          <ManualInvoiceFormFields
            control={control}
            errors={errors}
            labels={labels}
            parentOptions={parentOptions}
            studentOptions={studentOptions}
            draftCurrency={draftCurrency}
            variant="mobile"
            parentsLoading={parentsLoading}
            studentsLoading={studentsLoading}
          />

          <BaseCard>
            <BillingMonthSelector control={control} errors={errors} labels={labels} variant="mobile" />
          </BaseCard>

          <InvoiceDraftSummaryCard
            labels={labels}
            totalFormatted={totalFormatted}
            currency={draftCurrency}
            variant="mobile"
          />

          <ManualInvoiceActions
            labels={labels}
            canCreate={canCreate}
            canSendEmail={canSendEmail}
            isSubmitting={isSubmitting}
            variant="mobile"
            onSubmit={onSubmitClick}
            onSubmitAndSendEmail={onSubmitAndSendEmailClick}
          />
        </StyledFormFieldset>
      </Box>
    </PageContainer>
  );
}
