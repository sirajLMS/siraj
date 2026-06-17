"use client";

import { Box } from "@mui/material";
import type { Control, FieldErrors } from "react-hook-form";
import { BaseCard, PageContainer, PageHeader } from "@/frontend/components/ui";
import type { ParentInvoiceOption } from "@/frontend/stores/mocKAdminManualInvoiceStore";
import type { BillingManualLabels } from "@/shared/messages/types/dashboard/billing/manual";
import { BillingMonthSelector } from "./components/BillingMonthSelector";
import { InvoiceDraftSummaryCard } from "./components/InvoiceDraftSummaryCard";
import { ManualInvoiceActions } from "./components/ManualInvoiceActions";
import { ManualInvoiceFormFields } from "./components/ManualInvoiceFormFields";
import type { ManualInvoiceFormData } from "./schemas/manualInvoiceSchema";

interface ManualInvoiceMobileViewProps {
  readonly labels: BillingManualLabels;
  readonly parentOptions: readonly ParentInvoiceOption[];
  readonly control: Control<ManualInvoiceFormData>;
  readonly errors: FieldErrors<ManualInvoiceFormData>;
  readonly totalFormatted: string;
  readonly canCreate: boolean;
  readonly canSendEmail: boolean;
  readonly isSubmitting: boolean;
  readonly onSubmitClick: () => void;
  readonly onSubmitAndSendEmailClick: () => void;
}

export function ManualInvoiceMobileView({
  labels,
  parentOptions,
  control,
  errors,
  totalFormatted,
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
          variant="mobile"
        />

        <BaseCard>
          <BillingMonthSelector control={control} errors={errors} labels={labels} variant="mobile" />
        </BaseCard>

        <InvoiceDraftSummaryCard labels={labels} totalFormatted={totalFormatted} variant="mobile" />

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
