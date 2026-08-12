"use client";

import type { UserBillingProfileViewModel } from "@/frontend/common/views/dashboard/users/billing-profile/useUserBillingProfileViewModel";
import { BillingSectionMobile } from "@/frontend/mobile/views/dashboard/billing/components/__shared__/billingSectionShared.mobile";

export function UserBillingProfileMobileView({
  labels,
  metrics,
  summary,
  summaryLoading = false,
  invoices,
  searchQuery,
  loading,
  canView,
  canSubmitProof,
  canManage,
  canCreate,
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
}: Readonly<UserBillingProfileViewModel>) {
  return (
    <BillingSectionMobile
      labels={labels}
      pageTitle={labels.billingProfileTitle}
      pageSubtitle={labels.profileForUser}
      metrics={metrics}
      summary={summary}
      summaryLoading={summaryLoading}
      invoices={invoices}
      searchQuery={searchQuery}
      loading={loading}
      isSearchPending={isSearchPending}
      canView={canView}
      canSubmitProof={canSubmitProof}
      canManage={canManage}
      canCreate={canCreate}
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
