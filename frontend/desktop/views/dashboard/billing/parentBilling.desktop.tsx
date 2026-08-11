"use client";

import { Box } from "@mui/material";
import type { ParentBillingViewModel } from "@/frontend/common/views/dashboard/billing/useParentBillingViewModel";
import { BillingSectionDesktop } from "@/frontend/desktop/views/dashboard/billing/components/__shared__/billingSectionShared.desktop";

export function ParentBillingDesktopView({
  labels,
  summary,
  summaryLoading = false,
  invoices,
  searchQuery,
  loading,
  isSearchPending = false,
  canView,
  canSubmitProof,
  canManage,
  billingActionsDisabled = false,
  onSearchChange,
  onPayNow,
  onMarkAsPaid,
  onViewPaymentDetails,
  onDownloadPdf,
  onQuickPay,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: Readonly<ParentBillingViewModel>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <BillingSectionDesktop
        labels={labels}
        summary={summary}
        summaryLoading={summaryLoading}
        invoices={invoices}
        searchQuery={searchQuery}
        loading={loading}
        isSearchPending={isSearchPending}
        canView={canView}
        canSubmitProof={canSubmitProof}
        canManage={canManage}
        billingActionsDisabled={billingActionsDisabled}
        onSearchChange={onSearchChange}
        onPayNow={onPayNow}
        onMarkAsPaid={onMarkAsPaid}
        onViewPaymentDetails={onViewPaymentDetails}
        onDownloadPdf={onDownloadPdf}
        onQuickPay={onQuickPay}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={onPageChange}
      />
    </Box>
  );
}
