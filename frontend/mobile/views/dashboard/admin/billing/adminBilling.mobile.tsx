"use client";

import { AddOutlined, TimelineOutlined } from "@mui/icons-material";
import { Box, Button, Chip } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";
import { PageContainer, SectionPanel } from "@/frontend/common/components/ui";
import type { AdminBillingViewModel } from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingViewModel";
import { BillingMetricsRow } from "@/frontend/common/views/dashboard/billing/components/BillingMetricsRow";
import { BillingMobileSearchBar } from "@/frontend/common/views/dashboard/billing/components/BillingMobileSearchBar";
import { StudentCreditCardList } from "@/frontend/common/views/dashboard/billing/components/StudentCreditCardList";
import { buildAdminMetrics } from "@/frontend/common/views/dashboard/billing/utils/billingMetrics";
import {
  MobileCardList,
  MobileCardListItem,
  MobileContentStack,
  MobileEmptyState,
  MobileFab,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";
import { AdminInvoiceMobileCard } from "@/frontend/mobile/views/dashboard/admin/billing/components/adminInvoiceCard.mobile";
import { Link } from "@/shared/i18n/routing";

const StyledCreditFooterBox = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  borderTop: `1px solid ${theme.palette.outlineVariant}`,
}));

function ExchangeRatesLink({ labels }: { readonly labels: AdminBillingViewModel["labels"] }) {
  return (
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
  const invoicesList = invoices as readonly (typeof invoices)[number][];
  const loading = isSearchPending || (invoicesLoading && invoices.length === 0);
  const pageCount = totalCount !== undefined && pageSize && pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0;

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

  if (invoices.length === 0 && !invoicesLoading) {
    return (
      <SectionPanel title={labels.sections.recentInvoices}>
        <MobileEmptyState title={labels.parentTable.emptyTitle} subtitle={labels.adminTable.noEntries} />
      </SectionPanel>
    );
  }

  return (
    <SectionPanel title={labels.sections.recentInvoices}>
      <MobileCardList<(typeof invoices)[number]>
        rows={invoicesList}
        renderItem={renderItem}
        getKey={row => row.id}
        loading={loading}
        gap={2}
        layout="edge-to-edge"
        pagination={
          totalCount !== undefined
            ? { page: (page ?? 0) + 1, pageCount, rowCount: totalCount, pageSize: pageSize ?? 10, onPageChange }
            : undefined
        }
      />
    </SectionPanel>
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
        sendingReminderId={sendingReminderId}
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
  );
}

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
  invoicesLoading = false,
  sendingReminderId,
}: Readonly<AdminBillingViewModel>) {
  return (
    <>
      <PageContainer>
        <MobilePageHeader title={labels.adminPageTitle} subtitle={labels.adminPageSubtitle} edgeToEdge={false} />
        <MobileContentStack gap={3} paddingBottom={4}>
          {canViewExchangeRates ? <ExchangeRatesLink labels={labels} /> : null}
          <BillingMetricsRow metrics={buildAdminMetrics(summary, labels)} compact loading={summaryLoading} />
          <BillingMobileSearchBar
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
      </PageContainer>
      {canCreate && <MobileFab icon={<AddOutlined />} label={labels.manualInvoice} onClick={onManualInvoice} />}
    </>
  );
}
