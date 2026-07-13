"use client";

import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseCard, MobilePageHeader, PageContainer } from "@/frontend/common/components/ui";
import { BillingMonthSelector } from "@/frontend/views/dashboard/billing/manual/components/BillingMonthSelector";
import { InvoiceDraftSummaryCard } from "@/frontend/views/dashboard/billing/manual/components/InvoiceDraftSummaryCard";
import { ManualInvoiceActions } from "@/frontend/views/dashboard/billing/manual/components/ManualInvoiceActions";
import { ManualInvoiceFormFields } from "@/frontend/views/dashboard/billing/manual/components/ManualInvoiceFormFields";
import type { ManualInvoiceViewModel } from "@/frontend/views/dashboard/billing/manual/useManualInvoiceViewModel";

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
}: Readonly<ManualInvoiceViewModel>) {
  return (
    <PageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} edgeToEdge={false} />

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
