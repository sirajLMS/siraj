// cspell:ignore Financials
"use client";

import { ArrowBackOutlined } from "@mui/icons-material";
import { Box, Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseCard, PageContainer, PageHeader } from "@/frontend/components/ui";
import { BillingMonthSelector } from "@/frontend/views/dashboard/billing/manual/components/BillingMonthSelector";
import { InvoiceDraftSummaryCard } from "@/frontend/views/dashboard/billing/manual/components/InvoiceDraftSummaryCard";
import { ManualInvoiceActions } from "@/frontend/views/dashboard/billing/manual/components/ManualInvoiceActions";
import { ManualInvoiceFormFields } from "@/frontend/views/dashboard/billing/manual/components/ManualInvoiceFormFields";
import { ManualInvoiceSupportCards } from "@/frontend/views/dashboard/billing/manual/components/ManualInvoiceSupportCards";
import type { ManualInvoiceViewModel } from "@/frontend/views/dashboard/billing/manual/useManualInvoiceViewModel";

const StyledBackButton = styled(Button)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 700,
}));

const StyledFormFieldset = styled("fieldset")(({ theme }) => ({
  border: 0,
  margin: 0,
  padding: 0,
  minWidth: 0,
  "&:disabled": {
    opacity: theme.palette.action.disabledOpacity,
    pointerEvents: "none",
  },
}));

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
  parentsLoading,
  studentsLoading,
  onBack,
  onSubmitClick,
  onSubmitAndSendEmailClick,
}: Readonly<ManualInvoiceViewModel>) {
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
          <StyledFormFieldset disabled={!canCreate}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <ManualInvoiceFormFields
                control={control}
                errors={errors}
                labels={labels}
                parentOptions={parentOptions}
                studentOptions={studentOptions}
                draftCurrency={draftCurrency}
                variant="desktop"
                parentsLoading={parentsLoading}
                studentsLoading={studentsLoading}
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
          </StyledFormFieldset>
        </BaseCard>
      </Box>

      <ManualInvoiceSupportCards labels={labels} />
    </PageContainer>
  );
}
