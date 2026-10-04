"use client";

import { AddOutlined } from "@mui/icons-material";
import type { AdminBillingViewModel } from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingViewModel";
import { buildAdminMetrics } from "@/frontend/common/views/dashboard/billing/utils/billingMetrics";
import { MobileContentStack, MobileFab, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { ExchangeRatesLink, InvoicesSection } from "@/frontend/mobile/views/dashboard/admin/billing/adminBilling.parts";
import { StudentCreditSection } from "@/frontend/mobile/views/dashboard/admin/billing/adminBillingStudentCredit.parts";
import { BillingMetricsRowMobile } from "@/frontend/mobile/views/dashboard/billing/components/billingMetricsRow.mobile";
import { BillingMobileSearchBarMobile } from "@/frontend/mobile/views/dashboard/billing/components/billingMobileSearchBar.mobile";

export function AdminBillingMobileView({
  labels,
  summary,
  summaryLoading,
  invoices,
  creditRows,
  creditLoading,
  searchQuery,
  canManage,
  canCreate,
  canViewExchangeRates,
  billingActionsDisabled,
  creditFilter,
  isSearchPending,
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
  invoicesLoading,
  sendingReminderId,
}: Readonly<AdminBillingViewModel>) {
  return (
    <>
      <MobilePageContainer>
        <MobilePageHeader title={labels.adminPageTitle} subtitle={labels.adminPageSubtitle} edgeToEdge={false} />
        <MobileContentStack gap={3} paddingBottom={4}>
          {canViewExchangeRates ? <ExchangeRatesLink labels={labels} /> : null}
          <BillingMetricsRowMobile metrics={buildAdminMetrics(summary, labels)} compact loading={summaryLoading} />
          <BillingMobileSearchBarMobile
            value={searchQuery}
            placeholder={labels.search.invoicesPlaceholder}
            searchingLabel={labels.search.searching}
            isSearching={isSearchPending}
            onChange={onSearchChange}
          />
          <InvoicesSection
            labels={labels}
            invoices={invoices}
            canManage={canManage}
            canDelete={canDelete}
            billingActionsDisabled={billingActionsDisabled}
            isSearchPending={isSearchPending}
            invoicesLoading={invoicesLoading}
            onMarkAsPaid={onMarkAsPaid}
            onViewPaymentDetails={onViewPaymentDetails}
            onDeleteInvoice={onDeleteInvoice}
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={onPageChange}
          />
          {canManage && (
            <StudentCreditSection
              labels={labels}
              creditRows={creditRows}
              canManage={canManage}
              billingActionsDisabled={billingActionsDisabled}
              creditFilter={creditFilter}
              creditLoading={creditLoading}
              onSendReminder={onSendReminder}
              onViewAllNegativeBalance={onViewAllNegativeBalance}
              onClearCreditFilter={onClearCreditFilter}
              sendingReminderId={sendingReminderId}
            />
          )}
        </MobileContentStack>
      </MobilePageContainer>
      {canCreate && <MobileFab icon={<AddOutlined />} label={labels.manualInvoice} onClick={onManualInvoice} />}
    </>
  );
}
