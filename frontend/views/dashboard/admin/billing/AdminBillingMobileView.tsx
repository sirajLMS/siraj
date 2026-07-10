"use client";

import { AddOutlined, TimelineOutlined } from "@mui/icons-material";
import { Box, Button, Chip, Fab, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import { AdminInvoicesCardList } from "@/frontend/views/dashboard/admin/billing/components/AdminInvoicesCardList";
import { BillingMetricsRow } from "@/frontend/views/dashboard/billing/components/BillingMetricsRow";
import { BillingMobileSearchBar } from "@/frontend/views/dashboard/billing/components/BillingMobileSearchBar";
import { StudentCreditCardList } from "@/frontend/views/dashboard/billing/components/StudentCreditCardList";
import type { AdminBillingViewProps } from "@/frontend/views/dashboard/billing/types/billingViewTypes";
import { buildAdminMetrics } from "@/frontend/views/dashboard/billing/utils/billingMetrics";
import { Link } from "@/shared/i18n/routing";

const StyledEmptySubtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

const StyledCreditFooterBox = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  borderTop: `1px solid ${theme.palette.outlineVariant}`,
}));

// Floating action button for creating a manual invoice, fixed at bottom-right with primary colors
const StyledManualInvoiceFab = styled(Fab)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.onPrimary,
  position: "fixed",
  bottom: theme.spacing(3),
  right: theme.spacing(3),
  zIndex: theme.zIndex.speedDial,
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
  },
}));

export function AdminBillingMobileView({
  labels,
  summary,
  summaryLoading = false,
  invoices,
  creditRows,
  creditLoading = false,
  searchQuery,
  canManage,
  canCreate,
  canViewExchangeRates,
  billingActionsDisabled = false,
  creditFilter,
  isSearchPending = false,
  onSearchChange,
  onMarkAsPaid,
  onViewPaymentDetails,
  onSendReminder,
  onManualInvoice,
  onViewAllNegativeBalance,
  onClearCreditFilter,
  onDeleteInvoice,
  canDelete = false,
  page,
  pageSize,
  totalCount,
  onPageChange,
  loading = false,
}: Readonly<AdminBillingViewProps>) {
  return (
    <>
      <PageContainer>
        <PageHeader title={labels.adminPageTitle} subtitle={labels.adminPageSubtitle} titleVariant="headlineMd" />
        {canViewExchangeRates ? (
          <Box sx={{ mb: 2, px: { xs: 2, md: 0 } }}>
            <Button
              component={Link}
              href="/billing/exchange-rates"
              variant="outlined"
              size="small"
              startIcon={<TimelineOutlined />}
            >
              {labels.exchangeRatesLink}
            </Button>
          </Box>
        ) : null}
        <BillingMetricsRow metrics={buildAdminMetrics(summary, labels)} compact loading={summaryLoading} />
        <BillingMobileSearchBar
          value={searchQuery}
          placeholder={labels.search.invoicesPlaceholder}
          searchingLabel={labels.search.searching}
          isSearching={isSearchPending}
          onChange={onSearchChange}
        />
        <SectionPanel title={labels.sections.recentInvoices}>
          {invoices.length === 0 && !loading ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography variant="headlineMd" sx={{ mb: 1 }}>
                {labels.parentTable.emptyTitle}
              </Typography>
              <StyledEmptySubtitle variant="bodyMd">{labels.adminTable.noEntries}</StyledEmptySubtitle>
            </Box>
          ) : (
            <AdminInvoicesCardList
              rows={invoices}
              canManage={canManage}
              canDelete={canDelete}
              billingActionsDisabled={billingActionsDisabled}
              loading={isSearchPending || (loading && invoices.length === 0)}
              onMarkAsPaid={onMarkAsPaid}
              onViewPaymentDetails={onViewPaymentDetails}
              onDeleteInvoice={onDeleteInvoice}
              labels={{
                markAsPaid: labels.adminTable.markAsPaid,
                quickPay: labels.adminTable.quickPay,
                reviewSubmission: labels.adminTable.reviewSubmission,
                viewRejection: labels.adminTable.viewRejection,
                viewDetails: labels.parentTable.viewDetails,
                deleteInvoice: labels.adminTable.deleteInvoice,
                statusLabels: labels.invoiceStatus,
              }}
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={onPageChange}
            />
          )}
        </SectionPanel>
        {canManage && (
          <SectionPanel
            id="student-credit-section"
            title={labels.sections.studentCreditStatus}
            subTitle={creditFilter === "negative_balance" ? labels.creditTable.showingNegativeBalanceOnly : undefined}
            actions={
              creditFilter === "negative_balance" ? (
                <Chip label={labels.creditTable.negativeBalance} size="small" color="error" />
              ) : undefined
            }
          >
            <StudentCreditCardList
              rows={creditRows}
              canManage={canManage}
              billingActionsDisabled={billingActionsDisabled}
              onSendReminder={onSendReminder}
              loading={creditLoading && creditRows.length === 0}
              labels={{
                classesLeft: labels.creditTable.classesLeft,
                sendReminder: labels.creditTable.sendReminder,
                creditStatusLabels: labels.creditStatus,
              }}
            />
            <StyledCreditFooterBox sx={{ py: 2, flexDirection: "column", gap: 1 }}>
              {creditFilter === "negative_balance" ? (
                <Button variant="text" sx={{ fontWeight: 700 }} onClick={onClearCreditFilter}>
                  {labels.creditTable.clearFilter}
                </Button>
              ) : (
                <Button variant="text" sx={{ fontWeight: 700 }} onClick={onViewAllNegativeBalance}>
                  {labels.viewAllNegativeBalance}
                </Button>
              )}
            </StyledCreditFooterBox>
          </SectionPanel>
        )}
      </PageContainer>
      {canCreate && (
        <StyledManualInvoiceFab aria-label={labels.manualInvoice} onClick={onManualInvoice}>
          <AddOutlined />
        </StyledManualInvoiceFab>
      )}
    </>
  );
}
