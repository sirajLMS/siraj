"use client";

import type { UserBillingProfileViewModel } from "@/frontend/common/views/dashboard/users/billing-profile/useUserBillingProfileViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { BillingSectionDesktop } from "@/frontend/desktop/views/dashboard/billing/components/__shared__/billingSectionShared.desktop";

export function UserBillingProfileDesktopView({
  labels,
  summary,
  summaryLoading = false,
  invoices,
  searchQuery,
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
  loading,
  isSearchPending = false,
}: Readonly<UserBillingProfileViewModel>) {
  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.billingProfileTitle} subtitle={labels.profileForUser} />
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
    </DesktopPageContainer>
  );
}
