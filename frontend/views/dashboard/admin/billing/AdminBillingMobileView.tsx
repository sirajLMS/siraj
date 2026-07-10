"use client";

import { AddOutlined, TimelineOutlined } from "@mui/icons-material";
import { Box, Button, Fab } from "@mui/material";
import { styled } from "@mui/material/styles";
import { PageContainer, PageHeader, SectionPanel } from "@/frontend/components/ui";
import { AdminInvoicesCardList } from "@/frontend/views/dashboard/admin/billing/components/AdminInvoicesCardList";
import { BillingMetricsRow } from "@/frontend/views/dashboard/billing/components/BillingMetricsRow";
import { BillingMobileSearchBar } from "@/frontend/views/dashboard/billing/components/BillingMobileSearchBar";
import { StudentCreditCardList } from "@/frontend/views/dashboard/billing/components/StudentCreditCardList";
import type { AdminBillingViewProps } from "@/frontend/views/dashboard/billing/types/billingViewTypes";
import { buildAdminMetrics } from "@/frontend/views/dashboard/billing/utils/billingMetrics";
import { Link } from "@/shared/i18n/routing";

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
  invoices,
  creditRows,
  searchQuery,
  canManage,
  canCreate,
  canViewExchangeRates,
  onSearchChange,
  onMarkAsPaid,
  onViewPaymentDetails,
  onSendReminder,
  onManualInvoice,
  page,
  pageSize,
  totalCount,
  onPageChange,
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
        <BillingMetricsRow metrics={buildAdminMetrics(summary, labels)} compact />
        <BillingMobileSearchBar
          value={searchQuery}
          placeholder={labels.search.invoicesPlaceholder}
          filterLabel={labels.search.filter}
          onChange={onSearchChange}
        />
        <SectionPanel title={labels.sections.recentInvoices}>
          <AdminInvoicesCardList
            rows={invoices}
            canManage={canManage}
            onMarkAsPaid={onMarkAsPaid}
            onViewPaymentDetails={onViewPaymentDetails}
            labels={{
              markAsPaid: labels.adminTable.markAsPaid,
              quickPay: labels.adminTable.quickPay,
              reviewSubmission: labels.adminTable.reviewSubmission,
              viewDetails: labels.parentTable.viewDetails,
              statusLabels: labels.invoiceStatus,
            }}
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={onPageChange}
          />
        </SectionPanel>
        {canManage && (
          <SectionPanel title={labels.sections.studentCreditStatus}>
            <StudentCreditCardList
              rows={creditRows}
              canManage={canManage}
              onSendReminder={onSendReminder}
              labels={{
                classesLeft: labels.creditTable.classesLeft,
                sendReminder: labels.creditTable.sendReminder,
                creditStatusLabels: labels.creditStatus,
              }}
            />
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
