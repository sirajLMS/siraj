import type { UserBillingProfileViewProps } from "@/frontend/common/views/dashboard/users/billing-profile/types/userBillingProfile.types";

/** Shared props that both desktop and mobile UserBillingProfile views forward to their BillingSection*. */
export type UserBillingSectionProps = Pick<
  UserBillingProfileViewProps,
  | "labels"
  | "summary"
  | "summaryLoading"
  | "invoices"
  | "searchQuery"
  | "loading"
  | "isSearchPending"
  | "canView"
  | "canSubmitProof"
  | "canManage"
  | "canCreate"
  | "billingActionsDisabled"
  | "onSearchChange"
  | "onPayNow"
  | "onMarkAsPaid"
  | "onViewPaymentDetails"
  | "onDownloadPdf"
  | "onQuickPay"
  | "page"
  | "pageSize"
  | "totalCount"
  | "onPageChange"
>;

/** Extract the shared billing-section props from a UserBillingProfileViewModel. */
export function useUserBillingSectionProps(
  vm: Readonly<UserBillingProfileViewProps>
): Readonly<UserBillingSectionProps> {
  return {
    labels: vm.labels,
    summary: vm.summary,
    summaryLoading: vm.summaryLoading,
    invoices: vm.invoices,
    searchQuery: vm.searchQuery,
    loading: vm.loading,
    isSearchPending: vm.isSearchPending,
    canView: vm.canView,
    canSubmitProof: vm.canSubmitProof,
    canManage: vm.canManage,
    canCreate: vm.canCreate,
    billingActionsDisabled: vm.billingActionsDisabled,
    onSearchChange: vm.onSearchChange,
    onPayNow: vm.onPayNow,
    onMarkAsPaid: vm.onMarkAsPaid,
    onViewPaymentDetails: vm.onViewPaymentDetails,
    onDownloadPdf: vm.onDownloadPdf,
    onQuickPay: vm.onQuickPay,
    page: vm.page,
    pageSize: vm.pageSize,
    totalCount: vm.totalCount,
    onPageChange: vm.onPageChange,
  };
}
