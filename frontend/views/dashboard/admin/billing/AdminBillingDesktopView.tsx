"use client";

import { AddOutlined, TimelineOutlined } from "@mui/icons-material";
import { Box, Button, Chip } from "@mui/material";
import { styled } from "@mui/material/styles";
import { PageContainer, PageHeader, PrimaryPageAction, SectionPanel } from "@/frontend/components/ui";
import { AdminInvoicesDataGrid } from "@/frontend/views/dashboard/admin/billing/components/AdminInvoicesDataGrid";
import { BillingMetricsRow } from "@/frontend/views/dashboard/billing/components/BillingMetricsRow";
import { BillingSearchBar } from "@/frontend/views/dashboard/billing/components/BillingSearchBar";
import { StudentCreditDataGrid } from "@/frontend/views/dashboard/billing/components/StudentCreditDataGrid";
import type { AdminBillingViewProps } from "@/frontend/views/dashboard/billing/types/billingViewTypes";
import { buildAdminMetrics } from "@/frontend/views/dashboard/billing/utils/billingMetrics";
import {
  getAdminInvoiceGridLabels,
  getStudentCreditGridLabels,
} from "@/frontend/views/dashboard/billing/utils/label-mappers";
import { Link } from "@/shared/i18n/routing";

// Chip indicating items requiring attention, styled with error colors
const StyledAttentionChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.error.main,
  color: theme.palette.onError,
}));

// Footer box for the student credit section with a top border separator
const StyledCreditFooterBox = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  borderTop: `1px solid ${theme.palette.outlineVariant}`,
}));

export function AdminBillingDesktopView({
  labels,
  summary,
  invoices,
  creditRows,
  searchQuery,
  loading,
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
    <PageContainer>
      <PageHeader
        title={labels.adminPageTitle}
        subtitle={labels.adminPageSubtitle}
        actions={
          <>
            {canViewExchangeRates ? (
              <Button
                component={Link}
                href="/billing/exchange-rates"
                variant="outlined"
                startIcon={<TimelineOutlined />}
              >
                {labels.exchangeRatesLink}
              </Button>
            ) : null}
            {canCreate ? (
              <PrimaryPageAction startIcon={<AddOutlined />} onClick={onManualInvoice}>
                {labels.manualInvoice}
              </PrimaryPageAction>
            ) : null}
          </>
        }
      />

      <BillingMetricsRow metrics={buildAdminMetrics(summary, labels)} />

      <SectionPanel
        title={labels.sections.recentInvoices}
        actions={
          <BillingSearchBar
            value={searchQuery}
            placeholder={labels.search.invoicesPlaceholder}
            filterLabel={labels.search.filter}
            onChange={onSearchChange}
          />
        }
      >
        <AdminInvoicesDataGrid
          rows={invoices}
          canManage={canManage}
          onMarkAsPaid={onMarkAsPaid}
          onViewPaymentDetails={onViewPaymentDetails}
          labels={getAdminInvoiceGridLabels(labels)}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={onPageChange}
          loading={loading}
        />
      </SectionPanel>

      {canManage && (
        <SectionPanel
          title={labels.sections.studentCreditStatus}
          actions={<StyledAttentionChip label={labels.requiresAttention} size="small" />}
        >
          <StudentCreditDataGrid
            rows={creditRows}
            canManage={canManage}
            onSendReminder={onSendReminder}
            labels={getStudentCreditGridLabels(labels)}
          />
          <StyledCreditFooterBox sx={{ py: 2 }}>
            <Button variant="text" sx={{ fontWeight: 700 }}>
              {labels.viewAllNegativeBalance}
            </Button>
          </StyledCreditFooterBox>
        </SectionPanel>
      )}
    </PageContainer>
  );
}
