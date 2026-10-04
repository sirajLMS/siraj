"use client";

import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import type { AdminBillingViewModel } from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingViewModel";
import { buildAdminMetrics } from "@/frontend/common/views/dashboard/billing/utils/billingMetrics";
import { getAdminInvoiceGridLabels } from "@/frontend/common/views/dashboard/billing/utils/label-mappers";
import { DesktopPageContainer, DesktopPageHeader, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import {
  AdminBillingHeaderActions,
  StudentCreditSection,
} from "@/frontend/desktop/views/dashboard/admin/billing/adminBilling.desktop.parts";
import { AdminInvoicesDataGridDesktop } from "@/frontend/desktop/views/dashboard/admin/billing/components/adminInvoicesDataGrid.desktop";
import { BillingMetricsRowDesktop } from "@/frontend/desktop/views/dashboard/billing/components/billingMetricsRow.desktop";

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
    <DesktopPageContainer>
      <DesktopPageHeader
        title={labels.adminPageTitle}
        subtitle={labels.adminPageSubtitle}
        actions={
          canViewExchangeRates || canCreate ? (
            <AdminBillingHeaderActions
              labels={labels}
              canViewExchangeRates={canViewExchangeRates}
              canCreate={canCreate}
              onManualInvoice={onManualInvoice}
            />
          ) : null
        }
      />

      <BillingMetricsRowDesktop metrics={adminMetrics} loading={summaryLoading} />

      <DesktopSectionPanel
        contentPadding={false}
        title={labels.sections.recentInvoices}
        actions={
          <SearchBarField
            value={searchQuery}
            placeholder={labels.search.invoicesPlaceholder}
            searchingLabel={labels.search.searching}
            isSearching={isSearchPending}
            onChange={onSearchChange}
            sx={{ maxWidth: 300 }}
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
    </DesktopPageContainer>
  );
}
