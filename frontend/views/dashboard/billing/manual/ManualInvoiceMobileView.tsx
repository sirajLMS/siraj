"use client";

import { Box } from "@mui/material";
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
        sx={{ display: "flex", flexDirection: "column", gap: 2, pb: 12 }}
      >
        <ManualInvoiceFormFields
          control={control}
          errors={errors}
          labels={labels}
          parentOptions={parentOptions}
          studentOptions={studentOptions}
          draftCurrency={draftCurrency}
          variant="mobile"
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
      </Box>
    </PageContainer>
  );
}
