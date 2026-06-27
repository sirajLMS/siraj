"use client";

import { Box } from "@mui/material";
import type { Control, FieldErrors } from "react-hook-form";
import { BaseCard, PageContainer, PageHeader } from "@/frontend/components/ui";
import type { BillingManualLabels } from "@/shared/messages/types/dashboard/billing/manual";
import { BillingMonthSelector } from "./components/BillingMonthSelector";
import { InvoiceDraftSummaryCard } from "./components/InvoiceDraftSummaryCard";
import { ManualInvoiceActions } from "./components/ManualInvoiceActions";
import { ManualInvoiceFormFields } from "./components/ManualInvoiceFormFields";
import type { ManualInvoiceFormData } from "./schemas/manualInvoiceSchema";
import type { ParentInvoiceOption, StudentOption } from "./types/manualInvoiceViewTypes";

interface ManualInvoiceMobileViewProps {
  readonly labels: BillingManualLabels;
  readonly parentOptions: readonly ParentInvoiceOption[];
  readonly studentOptions: readonly StudentOption[];
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
  studentOptions,
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
          studentOptions={studentOptions}
          variant="mobile"
        />

        <BaseCard>
          <BillingMonthSelector control={control} errors={errors} labels={labels} variant="mobile" />
        </BaseCard>

        <InvoiceDraftSummaryCard labels={labels} totalFormatted={totalFormatted} currency="USD" variant="mobile" />

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
