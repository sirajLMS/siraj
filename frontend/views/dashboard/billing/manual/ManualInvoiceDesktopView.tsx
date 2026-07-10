// cspell:ignore Financials
"use client";

import { ArrowBackOutlined } from "@mui/icons-material";
import { Box, Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { Control, FieldErrors } from "react-hook-form";
import { BaseCard, PageContainer, PageHeader } from "@/frontend/components/ui";
import type { CurrencyCode } from "@/frontend/graphql/generated/gql/graphql-types";
import { BillingMonthSelector } from "@/frontend/views/dashboard/billing/manual/components/BillingMonthSelector";
import { InvoiceDraftSummaryCard } from "@/frontend/views/dashboard/billing/manual/components/InvoiceDraftSummaryCard";
import { ManualInvoiceActions } from "@/frontend/views/dashboard/billing/manual/components/ManualInvoiceActions";
import { ManualInvoiceFormFields } from "@/frontend/views/dashboard/billing/manual/components/ManualInvoiceFormFields";
import { ManualInvoiceSupportCards } from "@/frontend/views/dashboard/billing/manual/components/ManualInvoiceSupportCards";
import type { ManualInvoiceFormData } from "@/frontend/views/dashboard/billing/manual/schemas/manualInvoiceSchema";
import type {
  ParentInvoiceOption,
  StudentOption,
} from "@/frontend/views/dashboard/billing/manual/types/manualInvoiceViewTypes";
import type { BillingManualLabels } from "@/shared/messages/types/dashboard/billing/manual";

const StyledBackButton = styled(Button)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 700,
}));

interface ManualInvoiceDesktopViewProps {
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
  readonly onBack: () => void;
  readonly onSubmitClick: () => void;
  readonly onSubmitAndSendEmailClick: () => void;
}

export function ManualInvoiceDesktopView({
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
          <StyledBackButton startIcon={<ArrowBackOutlined />} onClick={onBack}>
            {labels.backToFinancials}
          </StyledBackButton>
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
              studentOptions={studentOptions}
              draftCurrency={draftCurrency}
              variant="desktop"
            />
            <BillingMonthSelector control={control} errors={errors} labels={labels} variant="desktop" />
            <InvoiceDraftSummaryCard
              labels={labels}
              totalFormatted={totalFormatted}
              currency={draftCurrency}
              variant="desktop"
            />
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
