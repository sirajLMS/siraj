"use client";

import { useQuery } from "@apollo/client/react";
import { useCallback, useMemo, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { AppPermission, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  userBillingProfileInvoiceHistoryQueryDocument,
  userBillingProfileSummaryQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useDocumentTitle } from "@/frontend/common/hooks/useDocumentTitle";
import { useImpersonation } from "@/frontend/common/hooks/useImpersonation";
import { buildFxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import {
  formatBillingCurrencyTotals,
  mapBillingCurrencyBuckets,
} from "@/frontend/common/lib/formatBillingCurrencyTotals";
import { formatCurrencyForDisplay } from "@/frontend/common/lib/fx-render";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useUserBillingProfileStore } from "@/frontend/common/stores/userBillingProfileStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { useBillingPollInterval } from "@/frontend/common/views/dashboard/billing/hooks/useBillingPollInterval";
import { useRefetchOnWindowFocus } from "@/frontend/common/views/dashboard/billing/hooks/useRefetchOnWindowFocus";
import type {
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import { buildParentMetrics } from "@/frontend/common/views/dashboard/billing/utils/billingMetrics";
import { buildBillingLabels } from "@/frontend/common/views/dashboard/billing/utils/buildBillingLabels";
import {
  formatBillingDate,
  formatBillingMonth,
} from "@/frontend/common/views/dashboard/billing/utils/formatBillingDate";
import { deriveParentInvoiceDisplayStatus } from "@/frontend/common/views/dashboard/billing/utils/invoiceDisplayStatus";
import type { UserBillingProfileViewProps } from "@/frontend/common/views/dashboard/users/billing-profile/types/userBillingProfile.types";
import { useAppTranslation } from "@/shared/locale";

export type UserBillingProfileViewModel = UserBillingProfileViewProps;

export type UseUserBillingProfileViewModelProps = Pick<UserBillingProfileViewModel, "userId">;

export function useUserBillingProfileViewModel(
  props: Readonly<UseUserBillingProfileViewModelProps>
): UserBillingProfileViewModel {
  const { userId } = props;

  const t = useAppTranslation().dashboardTranslations.billing;
  const tProfile = useAppTranslation().profileTranslations.teacher;
  const tProfileRoot = useAppTranslation().profileTranslations.base;
  const tErrors = useAppTranslation().errorsTranslations;
  const tc = useAppTranslation().commonTranslations;
  const locale = useAppLocale();
  const labels = buildBillingLabels(t);
  const { isImpersonating } = useImpersonation();
  const billingActionsDisabled = isImpersonating;
  useDocumentTitle(null, "dashboard.billing", "billingProfileTitle");

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [proofTarget, setProofTarget] = useState<MarkPaidInvoiceTarget | null>(null);
  const [proofMode, setProofMode] = useState<"submit" | "markPaid">("submit");
  const [detailsTarget, setDetailsTarget] = useState<PaymentDetailsTarget | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info">("success");

  const showFeedback = useCallback((message: string, severity: "success" | "error" | "info") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const page = useUserBillingProfileStore(state => state.page);
  const pageSize = useUserBillingProfileStore(state => state.pageSize);
  const setPage = useUserBillingProfileStore(state => state.setPage);

  const debouncedApplySearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value.trim());
    setPage(0);
  }, 300);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      debouncedApplySearch(value);
    },
    [debouncedApplySearch]
  );

  const isSearchPending = searchQuery.trim() !== debouncedSearch.trim();
  const billingDialogsOpen = proofTarget !== null || detailsTarget !== null;
  const pollInterval = useBillingPollInterval(billingDialogsOpen);

  const {
    data: summaryData,
    loading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery(userBillingProfileSummaryQueryDocument, {
    variables: { userId, parentId: null },
    fetchPolicy: "cache-and-network",
    pollInterval,
  });

  const { data, loading, error, refetch } = useQuery(userBillingProfileInvoiceHistoryQueryDocument, {
    variables: {
      userId,
      parentId: null,
      search: debouncedSearch || null,
      paginationArgs: {
        first: pageSize,
        page: page + 1,
        skip: null,
        after: null,
        before: null,
        last: null,
        maxCount: null,
      },
    },
    skip: summaryLoading,
    fetchPolicy: "cache-and-network",
    pollInterval,
  });

  const refreshBillingData = useCallback(() => {
    void refetch();
    void refetchSummary();
  }, [refetch, refetchSummary]);

  useRefetchOnWindowFocus(refreshBillingData);

  const refreshAfterDialogClose = useCallback(() => {
    void refetch();
    void refetchSummary();
  }, [refetch, refetchSummary]);

  const fxMessages = useMemo(
    () => buildFxDisplayMessages(tProfile, tErrors, tProfileRoot),
    [tProfile, tErrors, tProfileRoot]
  );

  const totalCount = data?.parentInvoiceHistory?.totalCount ?? 0;

  const invoices = useMemo(
    () =>
      (data?.parentInvoiceHistory?.rows ?? []).map(inv => ({
        id: inv.id ?? "",
        invoiceNumber: (inv.id ?? "").slice(0, 8).toUpperCase(),
        month: formatBillingMonth(inv.issueDate, locale),
        issueDate: formatBillingDate(inv.issueDate, locale),
        dueDate: formatBillingDate(inv.dueDate, locale),
        paidDate: inv.paidDate ? formatBillingDate(inv.paidDate, locale) : "\u2014",
        hasPaymentProof: inv.hasPaymentProof ?? false,
        hasRejectedSubmission: inv.hasRejectedSubmission ?? false,
        fee: formatCurrencyForDisplay(
          inv.amount ?? "0",
          inv.currency ?? CurrencyCode.Usd,
          inv.displayAmount
            ? {
                amount: inv.displayAmount.amount,
                currency: inv.displayAmount.currency ?? CurrencyCode.Usd,
                stale: inv.displayAmount.stale ?? true,
              }
            : null,
          locale,
          fxMessages
        ),
        status: deriveParentInvoiceDisplayStatus(inv.status, inv.dueDate),
      })),
    [data?.parentInvoiceHistory, fxMessages, locale]
  );

  const summary = useMemo(() => {
    const outstandingTotals = formatBillingCurrencyTotals(
      mapBillingCurrencyBuckets(summaryData?.parentBillingSummary?.outstandingByCurrency),
      locale,
      fxMessages
    );
    const paidThisTermTotals = formatBillingCurrencyTotals(
      mapBillingCurrencyBuckets(summaryData?.parentBillingSummary?.paidThisTermByCurrency),
      locale,
      fxMessages
    );

    return {
      outstandingBalance: outstandingTotals.primary,
      outstandingBalanceSubLabel: outstandingTotals.breakdown,
      paidThisTerm: paidThisTermTotals.primary,
      paidThisTermSubLabel: paidThisTermTotals.breakdown,
      nextDueDate: formatBillingDate(summaryData?.parentBillingSummary?.nextDueDate ?? null, locale),
      activeStudents: String(summaryData?.parentBillingSummary?.activeStudents ?? 0),
    };
  }, [summaryData?.parentBillingSummary, locale, fxMessages]);

  const _isLoading = summaryLoading || loading || isSearchPending;

  const metrics = useMemo(() => buildParentMetrics(summary, labels), [summary, labels]);

  const hasPermission = useUserStore(state => state.hasPermission);
  const canManage = hasPermission(AppPermission.BillingUpdateStatusPaid);
  const canSubmitProof = hasPermission(AppPermission.BillingSubmitPaymentProof);
  const canCreate = hasPermission(AppPermission.BillingCreateInvoice);

  const openProofDialog = useCallback(
    (invoice: MarkPaidInvoiceTarget, mode: "submit" | "markPaid") => {
      if (billingActionsDisabled) {
        showFeedback(tErrors.auth.impersonationNotAllowedDuringSession, "error");
        return;
      }
      setProofMode(mode);
      setProofTarget({
        ...invoice,
        parentUserId: userId,
      });
    },
    [billingActionsDisabled, showFeedback, tErrors, userId]
  );

  const handlePayNow = useCallback(
    (invoice: MarkPaidInvoiceTarget) => {
      openProofDialog(invoice, "submit");
    },
    [openProofDialog]
  );

  const handleMarkAsPaid = useCallback(
    (invoice: MarkPaidInvoiceTarget) => {
      openProofDialog(invoice, "markPaid");
    },
    [openProofDialog]
  );

  const handleProofSuccess = useCallback(() => {
    refreshBillingData();
    showFeedback(proofMode === "markPaid" ? labels.markAsPaidSuccess : labels.submitProofSuccess, "success");
  }, [refreshBillingData, showFeedback, proofMode, labels]);

  const handleProofError = useCallback(
    (message: string) => {
      showFeedback(message, "error");
    },
    [showFeedback]
  );

  const handleDetailsSuccess = useCallback(
    (action: "approve" | "reject") => {
      refreshBillingData();
      showFeedback(action === "approve" ? labels.approveProofSuccess : labels.rejectProofSuccess, "success");
    },
    [refreshBillingData, showFeedback, labels]
  );

  const handleDownloadPdf = useCallback(
    (invoiceId: string) => {
      const popup = window.open(`/api/invoices/${invoiceId}/download`, "_blank", "noopener,noreferrer");
      if (!popup) {
        showFeedback(labels.notifications.popupBlocked, "error");
      }
    },
    [showFeedback, labels]
  );

  const handleQuickPay = useCallback(() => {
    if (billingActionsDisabled) {
      showFeedback(tErrors.auth.impersonationNotAllowedDuringSession, "error");
      return;
    }

    if (summaryLoading) {
      showFeedback(tc.loading, "info");
      return;
    }

    const nextUnpaid = summaryData?.parentBillingSummary?.nextUnpaidInvoice;
    if (nextUnpaid?.id) {
      handlePayNow({
        id: nextUnpaid.id,
        amount: formatCurrencyForDisplay(
          nextUnpaid.amount ?? "0",
          nextUnpaid.currency ?? CurrencyCode.Usd,
          null,
          locale,
          fxMessages
        ),
        dueDate: formatBillingDate(nextUnpaid.dueDate, locale),
        invoiceNumber: nextUnpaid.id.slice(0, 8).toUpperCase(),
        studentName: nextUnpaid.studentName,
      });
      return;
    }

    const pendingCount = summaryData?.parentBillingSummary?.pendingPaymentCount ?? 0;
    if (pendingCount > 0) {
      showFeedback(labels.notifications.paymentPendingReview, "info");
      return;
    }

    showFeedback(labels.noUnpaidInvoices, "info");
  }, [
    billingActionsDisabled,
    summaryLoading,
    summaryData,
    locale,
    fxMessages,
    handlePayNow,
    showFeedback,
    tErrors,
    tc,
    labels,
  ]);

  return {
    labels,
    summary,
    summaryLoading,
    metrics,
    invoices,
    searchQuery,
    canManage,
    canSubmitProof,
    canView: hasPermission(AppPermission.BillingViewHistory),
    canCreate,
    billingActionsDisabled,
    isSearchPending,
    onSearchChange: handleSearchChange,
    onPayNow: handlePayNow,
    onMarkAsPaid: canManage ? handleMarkAsPaid : undefined,
    onViewPaymentDetails: setDetailsTarget,
    onDownloadPdf: handleDownloadPdf,
    onQuickPay: handleQuickPay,
    page,
    pageSize,
    totalCount,
    onPageChange: setPage,
    loading: loading || isSearchPending,
    userId,
    // Dialog state and handlers needed by the view
    proofTarget,
    proofMode,
    detailsTarget,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    setProofTarget,
    setProofMode,
    setDetailsTarget,
    setSnackbarOpen,
    refreshAfterDialogClose,
    handleProofSuccess,
    handleProofError,
    handleDetailsSuccess,
  } as UserBillingProfileViewModel & {
    readonly proofTarget: MarkPaidInvoiceTarget | null;
    readonly proofMode: "submit" | "markPaid";
    readonly detailsTarget: PaymentDetailsTarget | null;
    readonly snackbarOpen: boolean;
    readonly snackbarMessage: string;
    readonly snackbarSeverity: "success" | "error" | "info";
    readonly setProofTarget: (target: MarkPaidInvoiceTarget | null) => void;
    readonly setProofMode: (mode: "submit" | "markPaid") => void;
    readonly setDetailsTarget: (target: PaymentDetailsTarget | null) => void;
    readonly setSnackbarOpen: (open: boolean) => void;
    readonly refreshAfterDialogClose: () => void;
    readonly handleProofSuccess: () => void;
    readonly handleProofError: (message: string) => void;
    readonly handleDetailsSuccess: (action: "approve" | "reject") => void;
  };
}
