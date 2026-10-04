"use client";

import { AccountBalanceWalletOutlined, TimelineOutlined } from "@mui/icons-material";
import type { ReactNode } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { AdminBillingViewModel } from "@/frontend/common/views/dashboard/admin/billing/useAdminBillingViewModel";
import {
  MobileCardList,
  MobileCardListItem,
  MobileContentInset,
  MobileEmptyState,
  MobileFilterButton,
  MobileSectionPanel,
} from "@/frontend/mobile/components/ui";
import { AdminInvoiceMobileCard } from "@/frontend/mobile/views/dashboard/admin/billing/components/adminInvoiceCard.mobile";
import { Link } from "@/shared/i18n";

function ExchangeRatesLink({ labels }: { readonly labels: AdminBillingViewModel["labels"] }) {
  return (
    <MobileContentInset sx={{ mb: 2, display: "flex", gap: 1.5, flexWrap: "wrap" }}>
      <Link href="/billing/exchange-rates" style={{ textDecoration: "none" }}>
        <MobileFilterButton size="small" startIcon={<TimelineOutlined />}>
          {labels.exchangeRatesLink}
        </MobileFilterButton>
      </Link>
      <Link href="/quotas" style={{ textDecoration: "none" }}>
        <MobileFilterButton size="small" startIcon={<AccountBalanceWalletOutlined />}>
          {labels.quotasLink}
        </MobileFilterButton>
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

export { ExchangeRatesLink, InvoicesSection };
