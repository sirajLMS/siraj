"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";
import {
  AppPermission,
  CurrencyCode,
  type InvoiceType as GqlInvoiceType,
  type StudentStatus as GqlStudentStatus,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  adminBillingSummaryQueryDocument,
  adminInvoicesQueryDocument,
  deleteInvoiceMutationDocument,
  sendPaymentReminderMutationDocument,
  studentCreditStatusQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useImpersonation } from "@/frontend/common/hooks/useImpersonation";
import { buildFxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import {
  formatBillingCurrencyTotals,
  mapBillingCurrencyBuckets,
} from "@/frontend/common/lib/formatBillingCurrencyTotals";
import { formatCurrencyForDisplay } from "@/frontend/common/lib/fx-render";
import { useAdminBillingStore } from "@/frontend/common/stores/adminBillingStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { logger } from "@/frontend/common/utils/logger";
import { buildBillingLabels } from "@/frontend/common/views/dashboard/admin/billing/utils/buildBillingLabels";
import { useBillingPollInterval } from "@/frontend/common/views/dashboard/billing/hooks/useBillingPollInterval";
import { useRefetchOnWindowFocus } from "@/frontend/common/views/dashboard/billing/hooks/useRefetchOnWindowFocus";
import type {
  AdminBillingSummary,
  AdminInvoiceRow,
  CreditFilter,
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
  StudentCreditRow,
} from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import { formatBillingDate } from "@/frontend/common/views/dashboard/billing/utils/formatBillingDate";
import { deriveAdminInvoiceDisplayStatus } from "@/frontend/common/views/dashboard/billing/utils/invoiceDisplayStatus";
import { useRouter } from "@/shared/i18n/routing";
import { useAppLocale, useAppTranslation } from "@/shared/locale/client";

function formatDate(dateStr: string | null, locale: string): string {
  return formatBillingDate(dateStr, locale);
}

function deriveInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const first = parts[0][0] ?? "";
    const second = parts.at(-1)?.[0] ?? "";
    return (first + second).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export interface AdminBillingViewModel {
  readonly labels: ReturnType<typeof buildBillingLabels>;
  readonly summary: AdminBillingSummary;
  readonly summaryLoading: boolean;
  readonly summaryError: Error | null;
  readonly invoices: readonly AdminInvoiceRow[];
  readonly invoicesLoading: boolean;
  readonly invoicesError: Error | null;
  readonly creditRows: readonly StudentCreditRow[];
  readonly creditLoading: boolean;
  readonly creditError: Error | null;
  readonly sendingReminderId: string | null;
  readonly searchQuery: string;
  readonly isSearchPending: boolean;
  readonly billingActionsDisabled: boolean;
  readonly creditFilter: CreditFilter;
  readonly canManage: boolean;
  readonly canCreate: boolean;
  readonly canDelete: boolean;
  readonly canViewExchangeRates: boolean;
  readonly deletingInvoice: boolean;
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number | undefined;
  readonly onSearchChange: (value: string) => void;
  readonly onMarkAsPaid: (invoice: MarkPaidInvoiceTarget) => void;
  readonly onViewPaymentDetails: (target: PaymentDetailsTarget) => void;
  readonly onSendReminder: (studentId: string) => void;
  readonly onViewAllNegativeBalance: () => void;
  readonly onClearCreditFilter: () => void;
  readonly onManualInvoice: () => void;
  readonly onDeleteInvoice: (invoiceId: string) => void;
  readonly onConfirmDeleteInvoice: () => void;
  readonly onPageChange: (page: number) => void;
  readonly onProofSuccess: () => void;
  readonly onProofError: (message: string) => void;
  readonly onDetailsSuccess: (action: "approve" | "reject") => void;
  readonly refreshBillingData: () => void;
  readonly refetchSummary: () => void;
  readonly refetchCredit: () => void;
  readonly proofTarget: MarkPaidInvoiceTarget | null;
  readonly detailsTarget: PaymentDetailsTarget | null;
  readonly deleteTargetId: string | null;
  readonly snackbarOpen: boolean;
  readonly snackbarMessage: string;
  readonly snackbarSeverity: "success" | "error";
  readonly onCloseSnackbar: () => void;
  readonly onCloseProofDialog: () => void;
  readonly onCloseDetailsDialog: () => void;
  readonly onCloseDeleteDialog: () => void;
}

export function useAdminBillingViewModel(): AdminBillingViewModel {
  const t = useAppTranslation("dashboard.billing");
  const tProfile = useAppTranslation("profile").teacher;
  const tProfileRoot = useAppTranslation("profile");
  const tErrors = useAppTranslation("errors");
  const tc = useAppTranslation("common");
  const locale = useAppLocale();
  const router = useRouter();
  const labels = buildBillingLabels(t);
  const { isImpersonating } = useImpersonation();
  const billingActionsDisabled = isImpersonating;
  const hasPermission = useUserStore(state => state.hasPermission);
  const canViewExchangeRates = hasPermission(AppPermission.BillingViewExchangeRates);
  const canManage = hasPermission(AppPermission.BillingUpdateStatusPaid);
  const canCreate = hasPermission(AppPermission.BillingCreateInvoice);
  const canDelete = hasPermission(AppPermission.BillingDeleteInvoice);

  const fxMessages = useMemo(
    () =>
      buildFxDisplayMessages(
        {
          convertedAmount: tProfile.convertedAmount,
        },
        tErrors,
        {
          convertedTotalApprox: tProfileRoot.convertedTotalApprox,
        }
      ),
    [tProfile, tErrors, tProfileRoot]
  );

  const page = useAdminBillingStore(state => state.page);
  const pageSize = useAdminBillingStore(state => state.pageSize);
  const setPage = useAdminBillingStore(state => state.setPage);
  const searchQuery = useAdminBillingStore(state => state.searchQuery);
  const debouncedSearch = useAdminBillingStore(state => state.debouncedSearch);
  const setSearchQuery = useAdminBillingStore(state => state.setSearchQuery);
  const setDebouncedSearch = useAdminBillingStore(state => state.setDebouncedSearch);
  const creditFilter = useAdminBillingStore(state => state.creditFilter);
  const setCreditFilter = useAdminBillingStore(state => state.setCreditFilter);
  const sendingReminderId = useAdminBillingStore(state => state.sendingReminderId);
  const proofTarget = useAdminBillingStore(state => state.proofTarget);
  const detailsTarget = useAdminBillingStore(state => state.detailsTarget);
  const deleteTargetId = useAdminBillingStore(state => state.deleteTargetId);
  const setProofTarget = useAdminBillingStore(state => state.setProofTarget);
  const setDetailsTarget = useAdminBillingStore(state => state.setDetailsTarget);
  const setDeleteTargetId = useAdminBillingStore(state => state.setDeleteTargetId);
  const setSendingReminderId = useAdminBillingStore(state => state.setSendingReminderId);
  const showFeedback = useAdminBillingStore(state => state.showFeedback);
  const snackbarOpen = useAdminBillingStore(state => state.snackbarOpen);
  const snackbarMessage = useAdminBillingStore(state => state.snackbarMessage);
  const snackbarSeverity = useAdminBillingStore(state => state.snackbarSeverity);
  const setSnackbarOpen = useAdminBillingStore(state => state.setSnackbarOpen);

  const debouncedApplySearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value.trim());
    setPage(0);
  }, 300);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    debouncedApplySearch(value);
  };

  const isSearchPending = searchQuery.trim() !== debouncedSearch.trim();
  const billingDialogsOpen = proofTarget !== null || detailsTarget !== null || deleteTargetId !== null;
  const pollInterval = useBillingPollInterval(billingDialogsOpen);

  const {
    data: invoicesData,
    loading: invoicesLoading,
    error: invoicesError,
    refetch: refetchInvoices,
  } = useQuery(adminInvoicesQueryDocument, {
    variables: {
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
    pollInterval,
  });

  const {
    data: summaryData,
    loading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery(adminBillingSummaryQueryDocument, {
    fetchPolicy: "cache-and-network",
    pollInterval,
  });

  const refreshBillingData = useCallback(() => {
    void refetchInvoices();
    void refetchSummary();
  }, [refetchInvoices, refetchSummary]);

  useRefetchOnWindowFocus(refreshBillingData);

  const {
    data: creditData,
    loading: creditLoading,
    error: creditError,
    refetch: refetchCredit,
  } = useQuery(studentCreditStatusQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const [deleteInvoiceMutation, { loading: deletingInvoice }] = useMutation(deleteInvoiceMutationDocument, {
    onCompleted: () => {
      setDeleteTargetId(null);
      showFeedback(labels.deleteInvoiceSuccess, "success");
      void refetchInvoices();
      void refetchSummary();
      void refetchCredit();
    },
    onError: error => {
      logger.error("Delete invoice failed:", { error });
      setDeleteTargetId(null);
      showFeedback(tc.operationFailed, "error");
    },
  });

  const [sendReminderMutation] = useMutation(sendPaymentReminderMutationDocument, {
    onCompleted: data => {
      if (data.sendPaymentReminder?.success) {
        showFeedback(t.reminderSent, "success");
      } else {
        showFeedback(t.reminderFailed, "error");
      }
      setSendingReminderId(null);
    },
    onError: error => {
      logger.error("Send reminder failed:", { error });
      showFeedback(tc.operationFailed, "error");
      setSendingReminderId(null);
    },
  });

  const invoices: AdminInvoiceRow[] = useMemo(
    () =>
      (invoicesData?.adminInvoices?.rows ?? []).map(inv => ({
        id: inv.id ?? "",
        studentId: inv.studentId ?? null,
        studentName: inv.studentName ?? inv.studentId ?? "Student",
        studentInitials: deriveInitials(inv.studentName),
        dateIssued: formatDate(inv.issueDate, locale),
        dueDate: formatDate(inv.dueDate, locale),
        amount: formatCurrencyForDisplay(
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
        status: deriveAdminInvoiceDisplayStatus(inv.status, inv.dueDate),
        parentUserId: inv.parentUserId ?? null,
        hasPaymentProof: inv.hasPaymentProof ?? false,
        hasRejectedSubmission: inv.hasRejectedSubmission ?? false,
      })),
    [invoicesData, locale, fxMessages]
  );

  const totalCount = invoicesData ? (invoicesData.adminInvoices?.totalCount ?? 0) : undefined;

  const summary: AdminBillingSummary = useMemo(() => {
    const outstandingTotals = formatBillingCurrencyTotals(
      mapBillingCurrencyBuckets(summaryData?.adminBillingSummary?.outstandingByCurrency),
      locale,
      fxMessages
    );
    const mtdRevenueTotals = formatBillingCurrencyTotals(
      mapBillingCurrencyBuckets(summaryData?.adminBillingSummary?.mtdRevenueByCurrency),
      locale,
      fxMessages
    );

    return {
      totalOutstanding: outstandingTotals.primary,
      totalOutstandingSubLabel: outstandingTotals.breakdown,
      pendingInvoices: summaryData?.adminBillingSummary?.pendingCount ?? 0,
      negativeBalanceCount: t.adminMetrics.negativeBalance(summaryData?.adminBillingSummary?.negativeBalanceCount ?? 0),
      mtdRevenue: mtdRevenueTotals.primary,
      mtdRevenueSubLabel: mtdRevenueTotals.breakdown,
    };
  }, [summaryData, locale, fxMessages, t]);

  const creditRows: StudentCreditRow[] = useMemo(
    () =>
      (creditData?.studentCreditStatus ?? [])
        .filter(
          (
            row
          ): row is {
            id: string;
            studentName: string;
            parentEmail: string;
            planType: GqlInvoiceType | null;
            classesRemaining: number;
            classesTotal: number;
            status: GqlStudentStatus;
          } => row.id != null && row.studentName != null && row.parentEmail != null && row.status != null
        )
        .map(row => ({
          id: row.id,
          studentName: row.studentName,
          parentEmail: row.parentEmail,
          planType: row.planType,
          classesLeft: row.classesRemaining,
          classesTotal: row.classesTotal,
          status: row.classesRemaining === 0 ? ("negative_balance" as const) : ("active_credit" as const),
        })),
    [creditData]
  );

  const filteredCreditRows = useMemo(
    () =>
      creditFilter === "negative_balance" ? creditRows.filter(row => row.status === "negative_balance") : creditRows,
    [creditFilter, creditRows]
  );

  const handleViewAllNegativeBalance = () => {
    setCreditFilter("negative_balance");
    document.getElementById("student-credit-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleClearCreditFilter = () => {
    setCreditFilter("all");
  };

  const handleMarkAsPaid = (invoice: MarkPaidInvoiceTarget) => {
    if (billingActionsDisabled) {
      showFeedback(tErrors.auth.impersonationNotAllowedDuringSession, "error");
      return;
    }
    setProofTarget(invoice);
  };

  const handleRequestDeleteInvoice = (invoiceId: string) => {
    if (billingActionsDisabled) {
      showFeedback(tErrors.auth.impersonationNotAllowedDuringSession, "error");
      return;
    }
    setDeleteTargetId(invoiceId);
  };

  const handleConfirmDeleteInvoice = () => {
    if (!deleteTargetId || deletingInvoice) {
      return;
    }
    void deleteInvoiceMutation({ variables: { invoiceId: deleteTargetId } });
  };

  const handleSendReminder = (studentId: string) => {
    if (billingActionsDisabled) {
      showFeedback(tErrors.auth.impersonationNotAllowedDuringSession, "error");
      return;
    }
    setSendingReminderId(studentId);
    void sendReminderMutation({ variables: { studentId } });
  };

  const handleManualInvoice = () => {
    router.push("/billing/manual");
  };

  const handleProofSuccess = () => {
    showFeedback(labels.markAsPaidSuccess, "success");
    void refetchInvoices();
    void refetchSummary();
  };

  const handleProofError = (message: string) => {
    showFeedback(message, "error");
  };

  const handleDetailsSuccess = (action: "approve" | "reject") => {
    showFeedback(action === "approve" ? labels.approveProofSuccess : labels.rejectProofSuccess, "success");
    void refetchInvoices();
    void refetchSummary();
  };

  return {
    labels,
    summary,
    summaryLoading,
    summaryError: summaryError ?? null,
    invoices,
    invoicesLoading,
    invoicesError: invoicesError ?? null,
    creditRows: filteredCreditRows,
    creditLoading,
    creditError: creditError ?? null,
    sendingReminderId,
    searchQuery,
    isSearchPending,
    billingActionsDisabled,
    creditFilter,
    canManage,
    canCreate: canCreate && !billingActionsDisabled,
    canDelete: canDelete && !billingActionsDisabled,
    canViewExchangeRates: canViewExchangeRates && !billingActionsDisabled,
    deletingInvoice,
    page,
    pageSize,
    totalCount,
    onSearchChange: handleSearchChange,
    onMarkAsPaid: handleMarkAsPaid,
    onViewPaymentDetails: setDetailsTarget,
    onSendReminder: handleSendReminder,
    onViewAllNegativeBalance: handleViewAllNegativeBalance,
    onClearCreditFilter: handleClearCreditFilter,
    onManualInvoice: handleManualInvoice,
    onDeleteInvoice: handleRequestDeleteInvoice,
    onConfirmDeleteInvoice: handleConfirmDeleteInvoice,
    onPageChange: setPage,
    onProofSuccess: handleProofSuccess,
    onProofError: handleProofError,
    onDetailsSuccess: handleDetailsSuccess,
    refreshBillingData,
    refetchSummary,
    refetchCredit,
    proofTarget,
    detailsTarget,
    deleteTargetId,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    onCloseSnackbar: () => setSnackbarOpen(false),
    onCloseProofDialog: () => {
      setProofTarget(null);
      refreshBillingData();
    },
    onCloseDetailsDialog: () => {
      setDetailsTarget(null);
      refreshBillingData();
    },
    onCloseDeleteDialog: () => {
      setDeleteTargetId(null);
      void refetchCredit();
    },
  };
}
