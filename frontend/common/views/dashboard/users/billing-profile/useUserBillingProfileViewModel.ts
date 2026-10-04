"use client";

import { useMemo } from "react";
import { useDocumentTitle } from "@/frontend/common/hooks/useDocumentTitle";
import { useBillingPollInterval } from "@/frontend/common/views/dashboard/billing/hooks/useBillingPollInterval";
import { useRefetchOnWindowFocus } from "@/frontend/common/views/dashboard/billing/hooks/useRefetchOnWindowFocus";
import { buildParentMetrics } from "@/frontend/common/views/dashboard/billing/utils/billingMetrics";
import { useBillingTranslationBase } from "@/frontend/common/views/dashboard/billing/utils/billingTranslationBase";
import type { UserBillingProfileViewProps } from "@/frontend/common/views/dashboard/users/billing-profile/types/userBillingProfile.types";
import { useBillingProfileActions } from "@/frontend/common/views/dashboard/users/billing-profile/useUserBillingProfileViewModel.actions";
import { buildUserBillingProfileViewModel } from "@/frontend/common/views/dashboard/users/billing-profile/useUserBillingProfileViewModel.builder";
import {
  useBillingProfileDialogs,
  useBillingProfileFxMessages,
  useBillingProfilePagination,
  useBillingProfilePermissions,
  useBillingProfileSearch,
} from "@/frontend/common/views/dashboard/users/billing-profile/useUserBillingProfileViewModel.helpers";
import {
  useBillingProfileInvoices,
  useBillingProfileQueries,
  useBillingProfileSummary,
} from "@/frontend/common/views/dashboard/users/billing-profile/useUserBillingProfileViewModel.queries";
import { Translation } from "@/shared/locale";

export type UserBillingProfileViewModel = UserBillingProfileViewProps;

export type UseUserBillingProfileViewModelProps = Pick<UserBillingProfileViewModel, "userId">;

export function useUserBillingProfileViewModel(
  props: Readonly<UseUserBillingProfileViewModelProps>
): UserBillingProfileViewModel {
  const { userId } = props;

  const { tProfile, tProfileRoot, tErrors, tc, locale, labels, billingActionsDisabled } = useBillingTranslationBase();
  useDocumentTitle(null, Translation.Dashboard.Billing, "billingProfileTitle");

  const { searchQuery, debouncedSearch, isSearchPending, handleSearchChange } = useBillingProfileSearch();
  const dialogs = useBillingProfileDialogs();
  const fxMessages = useBillingProfileFxMessages(tProfile, tErrors, tProfileRoot);
  const { page, pageSize, setPage } = useBillingProfilePagination();

  const { summaryData, summaryLoading, refetchSummary, data, loading, refetch } = useBillingProfileQueries(
    userId,
    debouncedSearch,
    page,
    pageSize,
    useBillingPollInterval(dialogs.billingDialogsOpen)
  );

  const invoices = useBillingProfileInvoices(data, fxMessages, locale);
  const summary = useBillingProfileSummary(summaryData, fxMessages, locale);
  const metrics = useMemo(() => buildParentMetrics(summary, labels), [summary, labels]);
  const permissions = useBillingProfilePermissions();

  const actions = useBillingProfileActions({
    userId,
    billingActionsDisabled,
    summaryLoading,
    summaryData,
    locale,
    fxMessages,
    labels,
    tErrors,
    tc,
    showFeedback: dialogs.showFeedback,
    setProofMode: dialogs.setProofMode,
    setProofTarget: dialogs.setProofTarget,
    proofMode: dialogs.proofMode,
    refetch,
    refetchSummary,
  });

  useRefetchOnWindowFocus(actions.refreshBillingData);

  return buildUserBillingProfileViewModel({
    labels,
    summary,
    summaryLoading,
    metrics,
    invoices,
    searchQuery,
    permissions,
    billingActionsDisabled,
    isSearchPending,
    handleSearchChange,
    handlePayNow: actions.handlePayNow,
    handleMarkAsPaid: actions.handleMarkAsPaid,
    handleDownloadPdf: actions.handleDownloadPdf,
    handleQuickPay: actions.handleQuickPay,
    page,
    pageSize,
    data,
    loading,
    setPage,
    userId,
    dialogs,
    refreshAfterDialogClose: actions.refreshAfterDialogClose,
    handleProofSuccess: actions.handleProofSuccess,
    handleProofError: actions.handleProofError,
    handleDetailsSuccess: actions.handleDetailsSuccess,
  });
}
