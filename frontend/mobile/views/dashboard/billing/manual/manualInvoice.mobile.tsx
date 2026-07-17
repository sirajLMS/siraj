"use client";

import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseCard } from "@/frontend/common/components/ui";
import type { ManualInvoiceViewModel } from "@/frontend/common/views/dashboard/billing/manual/useManualInvoiceViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { BillingMonthSelectorMobile } from "@/frontend/mobile/views/dashboard/billing/manual/components/billingMonthSelector.mobile";
import { InvoiceDraftSummaryCardMobile } from "@/frontend/mobile/views/dashboard/billing/manual/components/invoiceDraftSummaryCard.mobile";
import { ManualInvoiceActionsMobile } from "@/frontend/mobile/views/dashboard/billing/manual/components/manualInvoiceActions.mobile";
import { ManualInvoiceFormFieldsMobile } from "@/frontend/mobile/views/dashboard/billing/manual/components/manualInvoiceFormFields.mobile";

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
    <MobilePageContainer>
      <MobilePageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} edgeToEdge={false} />

      <Box
        component="form"
        onSubmit={event => {
          event.preventDefault();
        }}
      >
        <StyledFormFieldset disabled={!canCreate}>
          <ManualInvoiceFormFieldsMobile
            control={control}
            errors={errors}
            labels={labels}
            parentOptions={parentOptions}
            studentOptions={studentOptions}
            draftCurrency={draftCurrency}
            parentsLoading={parentsLoading}
            studentsLoading={studentsLoading}
          />

          <BaseCard>
            <BillingMonthSelectorMobile control={control} errors={errors} labels={labels} />
          </BaseCard>

          <InvoiceDraftSummaryCardMobile labels={labels} totalFormatted={totalFormatted} currency={draftCurrency} />

          <ManualInvoiceActionsMobile
            labels={labels}
            canCreate={canCreate}
            canSendEmail={canSendEmail}
            isSubmitting={isSubmitting}
            onSubmit={onSubmitClick}
            onSubmitAndSendEmail={onSubmitAndSendEmailClick}
          />
        </StyledFormFieldset>
      </Box>
    </MobilePageContainer>
  );
}
