// cspell:ignore Financials
"use client";

import { ArrowBackOutlined } from "@mui/icons-material";
import { Box, Button } from "@mui/material";
import { styled } from "@mui/material/styles";
import { BaseCard } from "@/frontend/common/components/ui";
import type { ManualInvoiceViewModel } from "@/frontend/common/views/dashboard/billing/manual/useManualInvoiceViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { BillingMonthSelectorDesktop } from "@/frontend/desktop/views/dashboard/billing/manual/components/billingMonthSelector.desktop";
import { InvoiceDraftSummaryCardDesktop } from "@/frontend/desktop/views/dashboard/billing/manual/components/invoiceDraftSummaryCard.desktop";
import { ManualInvoiceActionsDesktop } from "@/frontend/desktop/views/dashboard/billing/manual/components/manualInvoiceActions.desktop";
import { ManualInvoiceFormFieldsDesktop } from "@/frontend/desktop/views/dashboard/billing/manual/components/manualInvoiceFormFields.desktop";
import { ManualInvoiceSupportCardsDesktop } from "@/frontend/desktop/views/dashboard/billing/manual/components/manualInvoiceSupportCards.desktop";

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
  profileLabels,
  selectedParentId,
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
}: Readonly<ManualInvoiceViewModel>) {
  return (
    <DesktopPageContainer>
      <DesktopPageHeader
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
              <ManualInvoiceFormFieldsDesktop
                control={control}
                errors={errors}
                labels={labels}
                profileLabels={profileLabels}
                selectedParentId={selectedParentId}
              />
              <BillingMonthSelectorDesktop control={control} errors={errors} labels={labels} />
              <InvoiceDraftSummaryCardDesktop
                labels={labels}
                totalFormatted={totalFormatted}
                currency={draftCurrency}
              />
              <ManualInvoiceActionsDesktop
                labels={labels}
                canCreate={canCreate}
                canSendEmail={canSendEmail}
                isSubmitting={isSubmitting}
                onSubmit={onSubmitClick}
                onSubmitAndSendEmail={onSubmitAndSendEmailClick}
              />
            </Box>
          </StyledFormFieldset>
        </BaseCard>
      </Box>

      <ManualInvoiceSupportCardsDesktop labels={labels} />
    </DesktopPageContainer>
  );
}
