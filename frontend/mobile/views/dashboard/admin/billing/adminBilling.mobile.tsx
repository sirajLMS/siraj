"use client";

import { AccountBalanceWalletOutlined, AddOutlined, TimelineOutlined } from "@mui/icons-material";
import { Button } from "@mui/material";
import type { ReactNode } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { StudentCreditFooterShared } from "@/frontend/common/views/dashboard/admin/billing/__shared__/studentCreditFooterShared";
import type { AdminBillingViewModel } from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingViewModel";
import { buildAdminMetrics } from "@/frontend/common/views/dashboard/billing/utils/billingMetrics";
import {
  MobileCardList,
  MobileCardListItem,
  MobileContentInset,
  MobileContentStack,
  MobileEmptyState,
  MobileFab,
  MobilePageContainer,
  MobilePageHeader,
  MobileSectionPanel,
  MobileStatusBadge,
} from "@/frontend/mobile/components/ui";
import { AdminInvoiceMobileCard } from "@/frontend/mobile/views/dashboard/admin/billing/components/adminInvoiceCard.mobile";
import { BillingMetricsRowMobile } from "@/frontend/mobile/views/dashboard/billing/components/billingMetricsRow.mobile";
import { BillingMobileSearchBarMobile } from "@/frontend/mobile/views/dashboard/billing/components/billingMobileSearchBar.mobile";
import { StudentCreditCardListMobile } from "@/frontend/mobile/views/dashboard/billing/components/studentCreditCardList.mobile";
import { Link } from "@/shared/i18n";

function ExchangeRatesLink({ labels }: { readonly labels: AdminBillingViewModel["labels"] }) {
  return (
    <MobileContentInset sx={{ mb: 2, display: "flex", gap: 1.5, flexWrap: "wrap" }}>
      <Link href="/billing/exchange-rates" style={{ textDecoration: "none" }}>
        <Button variant="outlined" size="small" startIcon={<TimelineOutlined />}>
          {labels.exchangeRatesLink}
        </Button>
      </Link>
      <Link href="/quotas" style={{ textDecoration: "none" }}>
        <Button variant="outlined" size="small" startIcon={<AccountBalanceWalletOutlined />}>
          {labels.quotasLink}
        </Button>
      </Link>
    </MobileContentInset>
  );
}

function InvoicesSection({
  labels,
  invoices,
  canManage,
  canDelete,
  billingActionsDisabled,
  isSearchPending,
  invoicesLoading,
  onMarkAsPaid,
  onViewPaymentDetails,
  onDeleteInvoice,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: Readonly<
  Pick<
    AdminBillingViewModel,
    | "labels"
    | "invoices"
    | "canManage"
    | "canDelete"
    | "billingActionsDisabled"
    | "isSearchPending"
    | "invoicesLoading"
    | "onMarkAsPaid"
    | "onViewPaymentDetails"
    | "onDeleteInvoice"
    | "page"
    | "pageSize"
    | "totalCount"
    | "onPageChange"
  >
>) {
  const invoicesList = invoices;
  const loading = isSearchPending || (invoicesLoading && invoices.length === 0);
  const invoicesLoaded = !invoicesLoading;

  const renderItem = (row: (typeof invoices)[number]): ReactNode => (
    <MobileCardListItem variant="edge-to-edge">
      <AdminInvoiceMobileCard
        row={row}
        labels={labels}
        canManage={canManage}
        canDelete={canDelete}
        billingActionsDisabled={billingActionsDisabled}
        onMarkAsPaid={onMarkAsPaid}
        onViewPaymentDetails={onViewPaymentDetails}
        onDeleteInvoice={onDeleteInvoice}
      />
    </MobileCardListItem>
  );

  if (invoices.length === 0 && invoicesLoaded) {
    return (
      <MobileSectionPanel title={labels.sections.recentInvoices} contentInset={false}>
        <MobileEmptyState title={labels.parentTable.emptyTitle} subtitle={labels.adminTable.noEntries} />
      </MobileSectionPanel>
    );
  }

  return (
    <MobileSectionPanel title={labels.sections.recentInvoices} contentInset={false}>
      <MobileCardList<(typeof invoices)[number]>
        rows={invoicesList}
        renderItem={renderItem}
        getKey={row => row.id}
        loading={loading}
        gap={2}
        layout="edge-to-edge"
        paginationOptions={
          totalCount != null
            ? buildServerPaginationOptions({
                page: page ?? 0,
                pageSize: pageSize ?? 10,
                totalCount,
                onPageChange,
              })
            : { mode: "client" }
        }
      />
    </MobileSectionPanel>
  );
}

function StudentCreditSection({
  labels,
  creditRows,
  canManage,
  billingActionsDisabled,
  creditFilter,
  creditLoading,
  onSendReminder,
  onViewAllNegativeBalance,
  onClearCreditFilter,
  sendingReminderId,
}: {
  readonly labels: AdminBillingViewModel["labels"];
  readonly creditRows: AdminBillingViewModel["creditRows"];
  readonly canManage: boolean;
  readonly billingActionsDisabled?: boolean;
  readonly creditFilter: AdminBillingViewModel["creditFilter"];
  readonly creditLoading?: boolean;
  readonly onSendReminder: (id: string) => void;
  readonly onViewAllNegativeBalance: () => void;
  readonly onClearCreditFilter: () => void;
  readonly sendingReminderId?: string | null;
}) {
  return (
    <MobileSectionPanel
      id="student-credit-section"
      title={labels.sections.studentCreditStatus}
      subTitle={creditFilter === "negative_balance" ? labels.creditTable.showingNegativeBalanceOnly : undefined}
      contentInset={false}
      actions={
        creditFilter === "negative_balance" ? (
          <MobileStatusBadge category="invoice" status="OVERDUE" label={labels.creditTable.negativeBalance} />
        ) : undefined
      }
    >
      <StudentCreditCardListMobile
        rows={creditRows}
        canManage={canManage}
        billingActionsDisabled={billingActionsDisabled}
        onSendReminder={onSendReminder}
        loading={creditLoading && creditRows.length === 0}
        sendingReminderId={sendingReminderId}
        labels={{
          classesLeft: labels.creditTable.classesLeft,
          sendReminder: labels.creditTable.sendReminder,
          creditStatusLabels: labels.creditStatus,
        }}
      />
      <StudentCreditFooterShared
        isNegativeFilter={creditFilter === "negative_balance"}
        clearFilterLabel={labels.creditTable.clearFilter}
        viewAllNegativeBalanceLabel={labels.viewAllNegativeBalance}
        onClearCreditFilter={onClearCreditFilter}
        onViewAllNegativeBalance={onViewAllNegativeBalance}
        config={{ paddingInlineSx: { px: 2 } }}
      />
    </MobileSectionPanel>
  );
}

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
