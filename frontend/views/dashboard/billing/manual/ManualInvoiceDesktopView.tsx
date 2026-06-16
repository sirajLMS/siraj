// cspell:ignore Financials
"use client";

import { ArrowBackOutlined } from "@mui/icons-material";
import { Box, Button } from "@mui/material";
import type { Control, FieldErrors } from "react-hook-form";
import { BaseCard, PageContainer, PageHeader } from "@/frontend/components/ui";
import type { BillingManualLabels } from "@/frontend/messages/types/dashboard/billing/manual";
import type { ParentInvoiceOption } from "@/frontend/stores/adminManualInvoiceStore";
import { BillingMonthSelector } from "./components/BillingMonthSelector";
import { InvoiceDraftSummaryCard } from "./components/InvoiceDraftSummaryCard";
import { ManualInvoiceActions } from "./components/ManualInvoiceActions";
import { ManualInvoiceFormFields } from "./components/ManualInvoiceFormFields";
import { ManualInvoiceSupportCards } from "./components/ManualInvoiceSupportCards";
import type { ManualInvoiceFormData } from "./schemas/manualInvoiceSchema";

interface ManualInvoiceDesktopViewProps {
  readonly labels: BillingManualLabels;
  readonly parentOptions: readonly ParentInvoiceOption[];
  readonly control: Control<ManualInvoiceFormData>;
  readonly errors: FieldErrors<ManualInvoiceFormData>;
  readonly totalFormatted: string;
  readonly canCreate: boolean;
  readonly canSendEmail: boolean;
  readonly isSubmitting: boolean;
  readonly onBack: () => void;
  readonly onSubmitClick: () => void;
  readonly onSubmitAndSendEmailClick: () => void;
}

export function ManualInvoiceDesktopView({
  labels,
  parentOptions,
  control,
  errors,
  totalFormatted,
  canCreate,
  canSendEmail,
  isSubmitting,
  onBack,
  onSubmitClick,
  onSubmitAndSendEmailClick,
}: Readonly<ManualInvoiceDesktopViewProps>) {
  return (
    <PageContainer>
      <PageHeader
        title={labels.pageTitle}
        subtitle={labels.pageSubtitle}
        actions={
          <Button
            startIcon={<ArrowBackOutlined />}
            onClick={onBack}
            sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}
          >
            {labels.backToFinancials}
          </Button>
        }
      />

      <Box
        component="form"
        onSubmit={event => {
          event.preventDefault();
        }}
        sx={{ maxWidth: 960, mx: "auto", width: "100%" }}
      >
        <BaseCard sx={{ p: { xs: 3, md: 5 } }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <ManualInvoiceFormFields
              control={control}
              errors={errors}
              labels={labels}
              parentOptions={parentOptions}
              variant="desktop"
            />
            <BillingMonthSelector control={control} errors={errors} labels={labels} variant="desktop" />
            <InvoiceDraftSummaryCard labels={labels} totalFormatted={totalFormatted} variant="desktop" />
            <ManualInvoiceActions
              labels={labels}
              canCreate={canCreate}
              canSendEmail={canSendEmail}
              isSubmitting={isSubmitting}
              variant="desktop"
              onSubmit={onSubmitClick}
              onSubmitAndSendEmail={onSubmitAndSendEmailClick}
            />
          </Box>
        </BaseCard>
      </Box>

      <ManualInvoiceSupportCards labels={labels} />
    </PageContainer>
  );
}
