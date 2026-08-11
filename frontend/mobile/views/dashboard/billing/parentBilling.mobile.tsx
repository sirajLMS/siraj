"use client";

import type { ParentBillingViewModel } from "@/frontend/common/views/dashboard/billing/useParentBillingViewModel";
import { buildParentMetrics } from "@/frontend/common/views/dashboard/billing/utils/billingMetrics";
import { BillingSectionMobile } from "@/frontend/mobile/views/dashboard/billing/components/__shared__/billingSectionShared.mobile";

export function ParentBillingMobileView({
  labels,
  summary,
  summaryLoading = false,
  invoices,
  searchQuery,
  loading,
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
  isSearchPending = false,
}: Readonly<ParentBillingViewModel>) {
  const parentMetrics = buildParentMetrics(summary, labels);

  return (
    <BillingSectionMobile
      labels={labels}
      pageTitle={labels.parentPageTitle}
      pageSubtitle={labels.parentPageSubtitle}
      metrics={parentMetrics}
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
  );
}
