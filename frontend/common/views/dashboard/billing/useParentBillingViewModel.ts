"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";
import { AppPermission, CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  markInvoicePaidMutationDocument,
  parentBillingSummaryQueryDocument,
  parentInvoiceHistoryQueryDocument,
  submitPaymentProofMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useImpersonation } from "@/frontend/common/hooks/useImpersonation";
import { buildFxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import {
  formatBillingCurrencyTotals,
  mapBillingCurrencyBuckets,
} from "@/frontend/common/lib/formatBillingCurrencyTotals";
import { formatCurrencyForDisplay } from "@/frontend/common/lib/fx-render";
import { useParentBillingStore } from "@/frontend/common/stores/parentBillingStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import type {
  MarkPaidInvoiceTarget,
  ParentBillingViewProps,
} from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import type {
  ParentBillingSummary,
  ParentInvoiceRow,
} from "@/frontend/common/views/dashboard/billing/types/parentBillingTypes";
import { buildBillingLabels } from "@/frontend/common/views/dashboard/billing/utils/buildBillingLabels";
import {
  formatBillingDate,
  formatBillingMonth,
} from "@/frontend/common/views/dashboard/billing/utils/formatBillingDate";
import { deriveParentInvoiceDisplayStatus } from "@/frontend/common/views/dashboard/billing/utils/invoiceDisplayStatus";
import { useAppLocale, useAppTranslation } from "@/shared/locale";

// NEW FOR PLAN v5 (parent-billing wave): ViewModel now owns all state for the
// §6.1+§6.2 contract — the Server Component Page renders the Container with
// no props (mirrors useAdminBillingViewModel). The Container passes
// `Record<string, never>` into this hook (per specs.md §6.1 + §6.2).
export type UseParentBillingViewModelProps = Record<string, never>;

// NEW FOR PLAN v5 (parent-billing wave): Preserve the ParentBillingViewModel
// alias so tier views (parentBilling.{mobile,desktop}.tsx) keep their existing
// prop signature — the returned object is structurally identical to
// ParentBillingViewProps.
export type ParentBillingViewModel = ParentBillingViewProps;

export function useParentBillingViewModel(_props: Readonly<UseParentBillingViewModelProps>): ParentBillingViewModel {
  const t = useAppTranslation().dashboardTranslations.billing;
  const tProfile = useAppTranslation().profileTranslations.teacher;
  const tProfileRoot = useAppTranslation().profileTranslations.base;
  const tErrors = useAppTranslation().errorsTranslations;
  const tc = useAppTranslation().commonTranslations;
  const locale = useAppLocale();
  const labels = buildBillingLabels(t);
  const { isImpersonating } = useImpersonation();
  const billingActionsDisabled = isImpersonating;
  const hasPermission = useUserStore(state => state.hasPermission);

  const canManage = hasPermission(AppPermission.BillingUpdateStatusPaid);
  const canSubmitProof = hasPermission(AppPermission.BillingSubmitPaymentProof);
  const canView = hasPermission(AppPermission.BillingViewHistory);
  const canCreate = hasPermission(AppPermission.BillingCreateInvoice);

  const fxMessages = useMemo(
    () => buildFxDisplayMessages(tProfile, tErrors, tProfileRoot),
    [tProfile, tErrors, tProfileRoot]
  );

  const page = useParentBillingStore(state => state.page);
  const pageSize = useParentBillingStore(state => state.pageSize);
  const setPage = useParentBillingStore(state => state.setPage);
  const searchQuery = useParentBillingStore(state => state.searchQuery);
  const debouncedSearch = useParentBillingStore(state => state.debouncedSearch);
  const setSearchQuery = useParentBillingStore(state => state.setSearchQuery);
  const setDebouncedSearch = useParentBillingStore(state => state.setDebouncedSearch);
  const showFeedback = useParentBillingStore(state => state.showFeedback);
  const proofTarget = useParentBillingStore(state => state.proofTarget);
  const setProofTarget = useParentBillingStore(state => state.setProofTarget);
  const detailsTarget = useParentBillingStore(state => state.detailsTarget);
  const setDetailsTarget = useParentBillingStore(state => state.setDetailsTarget);
  const snackbarOpen = useParentBillingStore(state => state.snackbarOpen);
  const snackbarMessage = useParentBillingStore(state => state.snackbarMessage);
  const snackbarSeverity = useParentBillingStore(state => state.snackbarSeverity);
  const closeSnackbar = useParentBillingStore(state => state.closeSnackbar);

  const debouncedApplySearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value.trim());
    setPage(0);
  }, 300);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      debouncedApplySearch(value);
    },
    [debouncedApplySearch, setSearchQuery]
  );

  const isSearchPending = searchQuery.trim() !== debouncedSearch.trim();
  const dialogsOpen = proofTarget !== null || detailsTarget !== null;

  const {
    data: invoicesData,
    loading: invoicesLoading,
    refetch: refetchInvoices,
  } = useQuery(parentInvoiceHistoryQueryDocument, {
    variables: {
      parentId: null,
      userId: null,
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
    fetchPolicy: "cache-and-network",
    pollInterval: dialogsOpen ? 0 : 30_000,
  });

  const {
    data: summaryData,
    loading: summaryLoading,
    refetch: refetchSummary,
  } = useQuery(parentBillingSummaryQueryDocument, {
    variables: { parentId: null, userId: null },
    fetchPolicy: "cache-and-network",
    pollInterval: dialogsOpen ? 0 : 30_000,
  });

  const refreshBillingData = useCallback(() => {
    refetchInvoices().catch(() => {});
    refetchSummary().catch(() => {});
  }, [refetchInvoices, refetchSummary]);

  const [submitPaymentProofMutation, { loading: submittingProof }] = useMutation(submitPaymentProofMutationDocument, {
    onCompleted: () => {
      setProofTarget(null);
      showFeedback(labels.submitProofSuccess, "success");
      refreshBillingData();
    },
    onError: error => {
      setProofTarget(null);
      showFeedback(labels.submitProofDialog.errorGeneric, "error");
      logger.error("Parent submit payment proof failed:", { error });
    },
  });

  const [, { loading: markingPaid }] = useMutation(markInvoicePaidMutationDocument, {
    onCompleted: () => {
      setProofTarget(null);
      showFeedback(labels.markAsPaidSuccess, "success");
      refreshBillingData();
    },
    onError: error => {
      setProofTarget(null);
      showFeedback(labels.submitProofDialog.errorGeneric, "error");
      logger.error("Parent mark invoice paid failed:", { error });
    },
  });

  const invoices: readonly ParentInvoiceRow[] = useMemo(
    () =>
      (invoicesData?.parentInvoiceHistory?.rows ?? [])
        .filter((row): row is NonNullable<typeof row> => row != null)
        .map(inv => ({
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
    [invoicesData?.parentInvoiceHistory, fxMessages, locale]
  );

  const totalCount = invoicesData?.parentInvoiceHistory?.totalCount ?? 0;

  const summary: ParentBillingSummary = useMemo(() => {
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

  const handlePayNow = useCallback(
    (invoice: MarkPaidInvoiceTarget) => {
      if (billingActionsDisabled) {
        showFeedback(tErrors.auth.impersonationNotAllowedDuringSession, "error");
        return;
      }
      setProofTarget(invoice);
    },
    [billingActionsDisabled, setProofTarget, showFeedback, tErrors]
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
    handlePayNow,
    labels.noUnpaidInvoices,
    labels.notifications.paymentPendingReview,
    locale,
    fxMessages,
    showFeedback,
    summaryData?.parentBillingSummary,
    summaryLoading,
    tErrors,
    tc.loading,
  ]);

  const handleDownloadPdf = useCallback(
    (invoiceId: string) => {
      const popup = window.open(`/api/invoices/${invoiceId}/download`, "_blank", "noopener,noreferrer");
      if (!popup) {
        showFeedback(labels.notifications.popupBlocked, "error");
      }
    },
    [labels.notifications.popupBlocked, showFeedback]
  );

  const handleSubmitProof = useCallback(
    (invoiceId: string, proofFileId: string) => {
      submitPaymentProofMutation({
        variables: { invoiceId, proofFileId, expectedVersion: null },
      }).catch(() => {});
    },
    [submitPaymentProofMutation]
  );

  const handleMarkAsPaid = useCallback(
    (invoice: MarkPaidInvoiceTarget) => {
      if (!canManage) {
        return;
      }
      if (billingActionsDisabled) {
        showFeedback(tErrors.auth.impersonationNotAllowedDuringSession, "error");
        return;
      }
      setProofTarget(invoice);
    },
    [billingActionsDisabled, canManage, setProofTarget, showFeedback, tErrors]
  );

  const loading = invoicesLoading || isSearchPending || submittingProof || markingPaid;

  return {
    labels,
    summary,
    summaryLoading,
    invoices,
    loading,
    isSearchPending,
    billingActionsDisabled,
    searchQuery,
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
    canManage,
    canSubmitProof,
    canView,
    canCreate,
    proofTarget,
    detailsTarget,
    submitProof: handleSubmitProof,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    onCloseSnackbar: closeSnackbar,
    onCloseProofDialog: () => setProofTarget(null),
    onCloseDetailsDialog: () => setDetailsTarget(null),
    refreshBillingData,
  } as ParentBillingViewModel;
}
