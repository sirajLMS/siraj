"use client";

import { AddCardOutlined } from "@mui/icons-material";
import { Box, Fab, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import { BillingMetricsRow } from "@/frontend/views/dashboard/billing/components/BillingMetricsRow";
import { BillingMobileSearchBar } from "@/frontend/views/dashboard/billing/components/BillingMobileSearchBar";
import { ParentInvoicesCardList } from "@/frontend/views/dashboard/billing/components/ParentInvoicesCardList";
import { getParentInvoiceGridLabels } from "@/frontend/views/dashboard/billing/utils/label-mappers";
import type { UserBillingProfileMobileViewProps } from "@/frontend/views/dashboard/users/billing-profile/types/userBillingProfile.types";

const StyledEmptySubtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

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

export function UserBillingProfileMobileView({
  labels,
  metrics,
  summaryLoading = false,
  invoices,
  searchQuery,
  canView,
  canSubmitProof,
  canManage = false,
  billingActionsDisabled = false,
  onSearchChange,
  onPayNow,
  onMarkAsPaid,
  onViewPaymentDetails,
  onDownloadPdf,
  onQuickPay,
  page,
  pageSize,
  totalCount,
  onPageChange,
  loading,
  isSearchPending = false,
}: Readonly<UserBillingProfileMobileViewProps>) {
  const showQuickPayFab = canSubmitProof && !billingActionsDisabled;
  const listLoading = isSearchPending || (loading && invoices.length === 0);

  return (
    <>
      <PageContainer>
        <PageHeader title={labels.billingProfileTitle} subtitle={labels.profileForUser} titleVariant="headlineMd" />
        <BillingMetricsRow metrics={metrics} compact loading={summaryLoading} />
        <BillingMobileSearchBar
          value={searchQuery}
          placeholder={labels.search.parentPlaceholder}
          searchingLabel={labels.search.searching}
          isSearching={isSearchPending}
          onChange={onSearchChange}
        />
        <SectionPanel title={labels.sections.invoiceHistory}>
          {invoices.length === 0 && !listLoading ? (
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
              canManage={canManage}
              billingActionsDisabled={billingActionsDisabled}
              loading={listLoading}
              onPayNow={onPayNow}
              onMarkAsPaid={onMarkAsPaid}
              onViewPaymentDetails={onViewPaymentDetails}
              onDownloadPdf={onDownloadPdf}
              labels={{
                ...getParentInvoiceGridLabels(labels),
                hasPaymentProofHint: labels.hasPaymentProofHint,
              }}
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={onPageChange}
            />
          )}
        </SectionPanel>
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
