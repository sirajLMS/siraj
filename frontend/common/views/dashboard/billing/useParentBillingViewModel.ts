"use client";

import { useBillingPermissions } from "@/frontend/common/views/dashboard/billing/hooks/useBillingPermissions";
import type { ParentBillingViewProps } from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import {
  useBillingSummary,
  useInvoiceRows,
} from "@/frontend/common/views/dashboard/billing/useParentBillingViewModel.derived";
import { useBillingActionHandlers } from "@/frontend/common/views/dashboard/billing/useParentBillingViewModel.handlers";
import { useBillingMutations } from "@/frontend/common/views/dashboard/billing/useParentBillingViewModel.mutations";
import {
  useBillingData,
  useBillingRefresh,
  useBillingSearchHandlers,
  useBillingStoreState,
  useBillingTranslations,
} from "@/frontend/common/views/dashboard/billing/useParentBillingViewModel.state";

// The Container passes an empty props record; the ViewModel owns all billing
// state so the tier views receive a structurally identical prop object.
export type UseParentBillingViewModelProps = Record<string, never>;

// Keeps the tier-view prop alias stable while the returned object mirrors it.
export type ParentBillingViewModel = ParentBillingViewProps;

export function useParentBillingViewModel(_props: Readonly<UseParentBillingViewModelProps>): ParentBillingViewModel {
  const translations = useBillingTranslations();
  const permissions = useBillingPermissions();
  const store = useBillingStoreState();
  const search = useBillingSearchHandlers(store);
  const data = useBillingData(store);
  const refreshBillingData = useBillingRefresh(data);
  const mutations = useBillingMutations(translations, store, refreshBillingData);
  const { invoices, totalCount } = useInvoiceRows(translations, data);
  const summary = useBillingSummary(translations, data);
  const handlers = useBillingActionHandlers(translations, permissions, store, data);

  const loading = data.invoicesLoading || search.isSearchPending || mutations.submittingProof || mutations.markingPaid;

  return {
    labels: translations.labels,
    summary,
    summaryLoading: data.summaryLoading,
    invoices,
    loading,
    isSearchPending: search.isSearchPending,
    billingActionsDisabled: permissions.billingActionsDisabled,
    searchQuery: store.searchQuery,
    onSearchChange: search.handleSearchChange,
    onPayNow: handlers.handlePayNow,
    onMarkAsPaid: permissions.canManage ? handlers.handleMarkAsPaid : undefined,
    onViewPaymentDetails: store.setDetailsTarget,
    onDownloadPdf: handlers.handleDownloadPdf,
    onQuickPay: handlers.handleQuickPay,
    page: store.page,
    pageSize: store.pageSize,
    totalCount,
    onPageChange: store.setPage,
    canManage: permissions.canManage,
    canSubmitProof: permissions.canSubmitProof,
    canView: permissions.canView,
    canCreate: permissions.canCreate,
    proofTarget: store.proofTarget,
    detailsTarget: store.detailsTarget,
    submitProof: mutations.submitPaymentProof,
    snackbarOpen: store.snackbarOpen,
    snackbarMessage: store.snackbarMessage,
    snackbarSeverity: store.snackbarSeverity,
    onCloseSnackbar: store.closeSnackbar,
    onCloseProofDialog: () => store.setProofTarget(null),
    onCloseDetailsDialog: () => store.setDetailsTarget(null),
    refreshBillingData,
  } as ParentBillingViewModel;
}
