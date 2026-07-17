"use client";

import { AddOutlined, TimelineOutlined } from "@mui/icons-material";
import { Box, Button, Chip } from "@mui/material";
import { styled } from "@mui/material/styles";
import { PageContainer, PageHeader, PrimaryPageAction, SectionPanel } from "@/frontend/common/components/ui";
import type { AdminBillingViewModel } from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingViewModel";
import { buildAdminMetrics } from "@/frontend/common/views/dashboard/billing/utils/billingMetrics";
import {
  getAdminInvoiceGridLabels,
  getStudentCreditGridLabels,
} from "@/frontend/common/views/dashboard/billing/utils/label-mappers";
import { AdminInvoicesDataGridDesktop } from "@/frontend/desktop/views/dashboard/admin/billing/components/adminInvoicesDataGrid.desktop";
import { BillingMetricsRowDesktop } from "@/frontend/desktop/views/dashboard/billing/components/billingMetricsRow.desktop";
import { BillingSearchBarDesktop } from "@/frontend/desktop/views/dashboard/billing/components/billingSearchBar.desktop";
import { StudentCreditDataGridDesktop } from "@/frontend/desktop/views/dashboard/billing/components/studentCreditDataGrid.desktop";
import { Link } from "@/shared/i18n/routing";

const StyledAttentionChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.error.main,
  color: theme.palette.onError,
}));

const StyledCreditFooterBox = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  borderTop: `1px solid ${theme.palette.outlineVariant}`,
}));

function AdminBillingHeaderActions({
  labels,
  canViewExchangeRates,
  canCreate,
  onManualInvoice,
}: {
  readonly labels: AdminBillingViewModel["labels"];
  readonly canViewExchangeRates?: boolean;
  readonly canCreate: boolean;
  readonly onManualInvoice: () => void;
}) {
  return (
    <>
      {canViewExchangeRates ? (
        <Button component={Link} href="/billing/exchange-rates" variant="outlined" startIcon={<TimelineOutlined />}>
          {labels.exchangeRatesLink}
        </Button>
      ) : null}
      {canCreate ? (
        <PrimaryPageAction startIcon={<AddOutlined />} onClick={onManualInvoice}>
          {labels.manualInvoice}
        </PrimaryPageAction>
      ) : null}
    </>
  );
}

function StudentCreditSection({
  labels,
  creditRows,
  creditLoading,
  canManage,
  billingActionsDisabled,
  creditFilter,
  onSendReminder,
  onViewAllNegativeBalance,
  onClearCreditFilter,
  sendingReminderId,
}: {
  readonly labels: AdminBillingViewModel["labels"];
  readonly creditRows: AdminBillingViewModel["creditRows"];
  readonly creditLoading?: boolean;
  readonly canManage: boolean;
  readonly billingActionsDisabled?: boolean;
  readonly creditFilter: AdminBillingViewModel["creditFilter"];
  readonly onSendReminder: (id: string) => void;
  readonly onViewAllNegativeBalance: () => void;
  readonly onClearCreditFilter: () => void;
  readonly sendingReminderId?: string | null;
}) {
  const isNegativeFilter = creditFilter === "negative_balance";

  return (
    <SectionPanel
      id="student-credit-section"
      title={labels.sections.studentCreditStatus}
      actions={
        isNegativeFilter ? (
          <Chip label={labels.creditTable.negativeBalance} size="small" color="error" />
        ) : (
          <StyledAttentionChip label={labels.requiresAttention} size="small" />
        )
      }
      subTitle={isNegativeFilter ? labels.creditTable.showingNegativeBalanceOnly : undefined}
    >
      <StudentCreditDataGridDesktop
        rows={creditRows}
        canManage={canManage}
        billingActionsDisabled={billingActionsDisabled}
        onSendReminder={onSendReminder}
        labels={getStudentCreditGridLabels(labels)}
        loading={creditLoading && creditRows.length === 0}
        sendingReminderId={sendingReminderId}
      />
      <StyledCreditFooterBox sx={{ py: 2, flexDirection: "column", gap: 1 }}>
        {isNegativeFilter ? (
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
  );
}

export function AdminBillingDesktopView({
  labels,
  summary,
  summaryLoading = false,
  invoices,
  creditRows,
  creditLoading = false,
  searchQuery,
  invoicesLoading,
  isSearchPending = false,
  canManage,
  canCreate,
  canViewExchangeRates,
  billingActionsDisabled = false,
  creditFilter,
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
  sendingReminderId,
}: Readonly<AdminBillingViewModel>) {
  const adminMetrics = buildAdminMetrics(summary, labels);

  return (
    <PageContainer>
      <PageHeader
        title={labels.adminPageTitle}
        subtitle={labels.adminPageSubtitle}
        actions={
          <AdminBillingHeaderActions
            labels={labels}
            canViewExchangeRates={canViewExchangeRates}
            canCreate={canCreate}
            onManualInvoice={onManualInvoice}
          />
        }
      />

      <BillingMetricsRowDesktop metrics={adminMetrics} loading={summaryLoading} />

      <SectionPanel
        title={labels.sections.recentInvoices}
        actions={
          <BillingSearchBarDesktop
            value={searchQuery}
            placeholder={labels.search.invoicesPlaceholder}
            searchingLabel={labels.search.searching}
            isSearching={isSearchPending}
            onChange={onSearchChange}
          />
        }
      >
        <AdminInvoicesDataGridDesktop
          rows={invoices}
          canManage={canManage}
          canDelete={canDelete}
          billingActionsDisabled={billingActionsDisabled}
          onMarkAsPaid={onMarkAsPaid}
          onViewPaymentDetails={onViewPaymentDetails}
          onDeleteInvoice={onDeleteInvoice}
          labels={getAdminInvoiceGridLabels(labels)}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={onPageChange}
          loading={isSearchPending || (invoicesLoading && invoices.length === 0)}
        />
      </SectionPanel>

      {canManage && (
        <StudentCreditSection
          labels={labels}
          creditRows={creditRows}
          creditLoading={creditLoading}
          canManage={canManage}
          billingActionsDisabled={billingActionsDisabled}
          creditFilter={creditFilter}
          onSendReminder={onSendReminder}
          onViewAllNegativeBalance={onViewAllNegativeBalance}
          onClearCreditFilter={onClearCreditFilter}
          sendingReminderId={sendingReminderId}
        />
      )}
    </PageContainer>
  );
}
