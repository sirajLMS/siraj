"use client";

import { AddCardOutlined } from "@mui/icons-material";
import { Box, Fab, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { PageContainer, PageHeader } from "@/frontend/components/ui";
import { BillingMetricsRow } from "@/frontend/views/dashboard/billing/components/BillingMetricsRow";
import { BillingMobileSearchBar } from "@/frontend/views/dashboard/billing/components/BillingMobileSearchBar";
import { ParentInvoicesCardList } from "@/frontend/views/dashboard/billing/components/ParentInvoicesCardList";
import type { ParentBillingViewProps } from "@/frontend/views/dashboard/billing/types/billingViewTypes";
import { buildParentMetrics } from "@/frontend/views/dashboard/billing/utils/billingMetrics";

// Subtitle text for the empty state, styled with secondary text color
const StyledEmptySubtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

// Floating action button for quick pay, fixed at bottom-right with uppercase text
const StyledQuickPayFab = styled(Fab)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  position: "fixed",
  bottom: theme.spacing(3),
  right: theme.spacing(3),
  zIndex: theme.zIndex.speedDial,
  textTransform: "uppercase",
  fontWeight: 700,
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
}));

export function ParentBillingMobileView({
  labels,
  summary,
  invoices,
  searchQuery,
  canView,
  canSubmitProof,
  onSearchChange,
  onPayNow,
  onViewPaymentDetails,
  onDownloadPdf,
  onQuickPay,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: Readonly<ParentBillingViewProps>) {
  const showQuickPayFab = canSubmitProof;

  return (
    <>
      <PageContainer>
        <PageHeader title={labels.parentPageTitle} subtitle={labels.parentPageSubtitle} titleVariant="headlineMd" />
        <BillingMetricsRow metrics={buildParentMetrics(summary, labels)} compact />
        <BillingMobileSearchBar
          value={searchQuery}
          placeholder={labels.search.parentPlaceholder}
          filterLabel={labels.search.filter}
          onChange={onSearchChange}
        />
        <Typography variant="titleLg">{labels.sections.invoiceHistory}</Typography>
        {invoices.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography variant="headlineMd" sx={{ mb: 1 }}>
              {labels.parentTable.emptyTitle}
            </Typography>
            <StyledEmptySubtitle variant="bodyMd">{labels.parentTable.emptySubtitle}</StyledEmptySubtitle>
          </Box>
        ) : (
          <ParentInvoicesCardList
            rows={invoices}
            canView={canView}
            canSubmitProof={canSubmitProof}
            onPayNow={onPayNow}
            onViewPaymentDetails={onViewPaymentDetails}
            onDownloadPdf={onDownloadPdf}
            labels={{
              viewDetails: labels.parentTable.viewDetails,
              viewSubmission: labels.parentTable.viewSubmission,
              downloadPdf: labels.parentTable.downloadPdf,
              payNow: labels.parentTable.payNow,
              hasPaymentProofHint: labels.hasPaymentProofHint,
              statusLabels: labels.invoiceStatus,
            }}
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={onPageChange}
          />
        )}
      </PageContainer>
      {showQuickPayFab && (
        <StyledQuickPayFab variant="extended" aria-label={labels.quickPay} onClick={onQuickPay}>
          <AddCardOutlined sx={{ mr: 1 }} />
          {labels.quickPay}
        </StyledQuickPayFab>
      )}
    </>
  );
}
