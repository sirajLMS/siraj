"use client";

import { AccountBalanceWalletOutlined, AddOutlined, TimelineOutlined } from "@mui/icons-material";
import { Box, Button, Chip } from "@mui/material";
import { styled } from "@mui/material/styles";
import { StudentCreditFooterShared } from "@/frontend/common/views/dashboard/admin/billing/__shared__/studentCreditFooterShared";
import type { AdminBillingViewModel } from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingViewModel";
import { BillingSearchBar } from "@/frontend/common/views/dashboard/billing/components/BillingSearchBar";
import { buildAdminMetrics } from "@/frontend/common/views/dashboard/billing/utils/billingMetrics";
import {
  getAdminInvoiceGridLabels,
  getStudentCreditGridLabels,
} from "@/frontend/common/views/dashboard/billing/utils/label-mappers";
import { DesktopPrimaryPageAction, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { AdminInvoicesDataGridDesktop } from "@/frontend/desktop/views/dashboard/admin/billing/components/adminInvoicesDataGrid.desktop";
import { BillingMetricsRowDesktop } from "@/frontend/desktop/views/dashboard/billing/components/billingMetricsRow.desktop";
import { StudentCreditDataGridDesktop } from "@/frontend/desktop/views/dashboard/billing/components/studentCreditDataGrid.desktop";
import { Link } from "@/shared/i18n";

const StyledAttentionChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.error.main,
  color: theme.palette.onError,
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
        <Link href="/billing/exchange-rates" style={{ textDecoration: "none" }}>
          <Button variant="outlined" startIcon={<TimelineOutlined />}>
            {labels.exchangeRatesLink}
          </Button>
        </Link>
      ) : null}
      <Link href="/quotas" style={{ textDecoration: "none" }}>
        <Button variant="outlined" startIcon={<AccountBalanceWalletOutlined />}>
          {labels.quotasLink}
        </Button>
      </Link>
      {canCreate ? (
        <DesktopPrimaryPageAction startIcon={<AddOutlined />} onClick={onManualInvoice}>
          {labels.manualInvoice}
        </DesktopPrimaryPageAction>
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
    <DesktopSectionPanel
      id="student-credit-section"
      contentPadding={false}
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
      <StudentCreditFooterShared
        isNegativeFilter={isNegativeFilter}
        clearFilterLabel={labels.creditTable.clearFilter}
        viewAllNegativeBalanceLabel={labels.viewAllNegativeBalance}
        onClearCreditFilter={onClearCreditFilter}
        onViewAllNegativeBalance={onViewAllNegativeBalance}
        config={{ paddingInlineSx: undefined }}
      />
    </DesktopSectionPanel>
  );
}

export function AdminBillingDesktopView({
  labels,
  summary,
  summaryLoading,
  invoices,
  creditRows,
  creditLoading,
  searchQuery,
  invoicesLoading,
  isSearchPending,
  canManage,
  canCreate,
  canViewExchangeRates,
  billingActionsDisabled,
  creditFilter,
  onSearchChange,
  onMarkAsPaid,
  onViewPaymentDetails,
  onSendReminder,
  onManualInvoice,
  onViewAllNegativeBalance,
  onClearCreditFilter,
  onDeleteInvoice,
  canDelete,
  page,
  pageSize,
  totalCount,
  onPageChange,
  sendingReminderId,
}: Readonly<AdminBillingViewModel>) {
  const adminMetrics = buildAdminMetrics(summary, labels);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {canViewExchangeRates || canCreate ? (
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, flexWrap: "wrap" }}>
          <AdminBillingHeaderActions
            labels={labels}
            canViewExchangeRates={canViewExchangeRates}
            canCreate={canCreate}
            onManualInvoice={onManualInvoice}
          />
        </Box>
      ) : null}

      <BillingMetricsRowDesktop metrics={adminMetrics} loading={summaryLoading} />

      <DesktopSectionPanel
        contentPadding={false}
        title={labels.sections.recentInvoices}
        actions={
          <BillingSearchBar
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
      </DesktopSectionPanel>

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
    </Box>
  );
}
