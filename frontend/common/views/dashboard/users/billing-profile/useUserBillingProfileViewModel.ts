"use client";

import { useQuery } from "@apollo/client/react";
import { useCallback, useMemo, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import {
  userBillingProfileInvoiceHistoryQueryDocument,
  userBillingProfileSummaryQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useDocumentTitle } from "@/frontend/common/hooks/useDocumentTitle";
import type { FxDisplayMessages } from "@/frontend/common/lib/buildFxDisplayMessages";
import {
  formatBillingCurrencyTotals,
  mapBillingCurrencyBuckets,
} from "@/frontend/common/lib/formatBillingCurrencyTotals";
import { formatCurrencyForDisplay } from "@/frontend/common/lib/fx-render";
import { useUserBillingProfileStore } from "@/frontend/common/stores/userBillingProfileStore";
import { useBillingPermissions } from "@/frontend/common/views/dashboard/billing/hooks/useBillingPermissions";
import { useBillingPollInterval } from "@/frontend/common/views/dashboard/billing/hooks/useBillingPollInterval";
import { useDownloadInvoicePdf } from "@/frontend/common/views/dashboard/billing/hooks/useDownloadInvoicePdf";
import { useRefetchOnWindowFocus } from "@/frontend/common/views/dashboard/billing/hooks/useRefetchOnWindowFocus";
import type {
  MarkPaidInvoiceTarget,
  PaymentDetailsTarget,
} from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import type {
  ParentBillingSummary,
  ParentInvoiceRow,
} from "@/frontend/common/views/dashboard/billing/types/parentBillingTypes";
import { buildParentMetrics } from "@/frontend/common/views/dashboard/billing/utils/billingMetrics";
import {
  useBillingFxMessages,
  useBillingTranslationBase,
} from "@/frontend/common/views/dashboard/billing/utils/billingTranslationBase";
import {
  formatBillingDate,
  formatBillingMonth,
} from "@/frontend/common/views/dashboard/billing/utils/formatBillingDate";
import { deriveParentInvoiceDisplayStatus } from "@/frontend/common/views/dashboard/billing/utils/invoiceDisplayStatus";
import type { UserBillingProfileViewProps } from "@/frontend/common/views/dashboard/users/billing-profile/types/userBillingProfile.types";
import { type BillingLabels, type ErrorsLabels, Translation } from "@/shared/locale";

export type UserBillingProfileViewModel = UserBillingProfileViewProps;

export type UseUserBillingProfileViewModelProps = Pick<UserBillingProfileViewModel, "userId">;

type SnackbarSeverity = "success" | "error" | "info";
type ProofMode = "submit" | "markPaid";

type SummaryRow =
  | Operations.UserBillingProfileInvoiceHistoryQuery_parentInvoiceHistory_ParentInvoiceHistoryResult_rows_ParentInvoiceRow
  | undefined;

function mapInvoiceRow(inv: NonNullable<SummaryRow>, locale: string, fxMessages: FxDisplayMessages): ParentInvoiceRow {
  const id = inv.id ?? "";
  return {
    id,
    invoiceNumber: id.slice(0, 8).toUpperCase(),
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
            currency: inv.displayAmount.currency ?? null,
            stale: inv.displayAmount.stale ?? null,
          }
        : null,
      locale,
      fxMessages
    ),
    status: deriveParentInvoiceDisplayStatus(inv.status, inv.dueDate),
  };
}

function buildSummary(
  summaryData: Operations.UserBillingProfileSummaryQuery | undefined,
  locale: string,
  fxMessages: FxDisplayMessages
): ParentBillingSummary {
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
}

/** FX display message cache memoized on the translation slices that feed it. */
function useBillingProfileFxMessages(
  tProfile: { convertedAmount: (a: string, b: string, c: string, d: string) => string },
  tErrors: ErrorsLabels,
  tProfileRoot: { convertedTotalApprox: (a: string, b: string) => string }
): FxDisplayMessages {
  return useBillingFxMessages(tProfile, tErrors, tProfileRoot);
}

/** Local search input + debounced search-string derivation. */
function useBillingProfileSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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

  return {
    searchQuery,
    debouncedSearch,
    isSearchPending,
    handleSearchChange,
  };
}

/** Proof/details dialog + snackbar UI state. */
function useBillingProfileDialogs() {
  const [proofTarget, setProofTarget] = useState<MarkPaidInvoiceTarget | null>(null);
  const [proofMode, setProofMode] = useState<ProofMode>("submit");
  const [detailsTarget, setDetailsTarget] = useState<PaymentDetailsTarget | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<SnackbarSeverity>("success");

  const showFeedback = useCallback((message: string, severity: SnackbarSeverity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const billingDialogsOpen = proofTarget !== null || detailsTarget !== null;

  return {
    proofTarget,
    setProofTarget,
    proofMode,
    setProofMode,
    detailsTarget,
    setDetailsTarget,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    setSnackbarOpen,
    showFeedback,
    billingDialogsOpen,
  };
}

/** Apollo queries (summary + invoice history). */
function useBillingProfileQueries(
  userId: string,
  debouncedSearch: string,
  page: number,
  pageSize: number,
  pollInterval: number
) {
  const {
    data: summaryData,
    loading: summaryLoading,
    refetch: refetchSummary,
  } = useQuery(userBillingProfileSummaryQueryDocument, {
    variables: { userId, parentId: null },
    fetchPolicy: "cache-and-network",
    pollInterval,
  });

  const { data, loading, refetch } = useQuery(userBillingProfileInvoiceHistoryQueryDocument, {
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

  return {
    summaryData,
    summaryLoading,
    refetchSummary,
    data,
    loading,
    refetch,
  };
}

/** Memoized invoice rows derived from the history query. */
function useBillingProfileInvoices(
  data: Operations.UserBillingProfileInvoiceHistoryQuery | undefined,
  fxMessages: FxDisplayMessages,
  locale: string
): readonly ParentInvoiceRow[] {
  return useMemo(
    () =>
      (data?.parentInvoiceHistory?.rows ?? [])
        .filter((row): row is NonNullable<SummaryRow> => row != null)
        .map(inv => mapInvoiceRow(inv, locale, fxMessages)),
    [data?.parentInvoiceHistory, fxMessages, locale]
  );
}

/** Memoized summary block derived from the summary query. */
function useBillingProfileSummary(
  summaryData: Operations.UserBillingProfileSummaryQuery | undefined,
  fxMessages: FxDisplayMessages,
  locale: string
): ParentBillingSummary {
  return useMemo(() => buildSummary(summaryData, locale, fxMessages), [locale, fxMessages, summaryData]);
}

/** Permission gates derived once from the user store. */
function useBillingProfilePermissions() {
  return useBillingPermissions();
}

/** Pagination slice from the shared Zustand store. */
function useBillingProfilePagination() {
  const page = useUserBillingProfileStore(state => state.page);
  const pageSize = useUserBillingProfileStore(state => state.pageSize);
  const setPage = useUserBillingProfileStore(state => state.setPage);
  return { page, pageSize, setPage };
}

function runQuickPayFlow(args: {
  readonly billingActionsDisabled: boolean;
  readonly summaryLoading: boolean;
  readonly summaryData: Operations.UserBillingProfileSummaryQuery | undefined;
  readonly locale: string;
  readonly fxMessages: FxDisplayMessages;
  readonly labels: BillingLabels;
  readonly tErrors: ErrorsLabels;
  readonly tc: { loading: string };
  readonly showFeedback: (message: string, severity: SnackbarSeverity) => void;
  readonly handlePayNow: (invoice: MarkPaidInvoiceTarget) => void;
}): void {
  const {
    billingActionsDisabled,
    summaryLoading,
    summaryData,
    locale,
    fxMessages,
    labels,
    tErrors,
    tc,
    showFeedback,
    handlePayNow,
  } = args;

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
}

/** Mutating handlers and refresh callbacks. */
function useBillingProfileActions({
  userId,
  billingActionsDisabled,
  summaryLoading,
  summaryData,
  locale,
  fxMessages,
  labels,
  tErrors,
  tc,
  showFeedback,
  setProofMode,
  setProofTarget,
  proofMode,
  refetch,
  refetchSummary,
}: {
  readonly userId: string;
  readonly billingActionsDisabled: boolean;
  readonly summaryLoading: boolean;
  readonly summaryData: Operations.UserBillingProfileSummaryQuery | undefined;
  readonly locale: string;
  readonly fxMessages: FxDisplayMessages;
  readonly labels: BillingLabels;
  readonly tErrors: ErrorsLabels;
  readonly tc: { loading: string };
  readonly showFeedback: (message: string, severity: SnackbarSeverity) => void;
  readonly setProofMode: (mode: ProofMode) => void;
  readonly setProofTarget: (target: MarkPaidInvoiceTarget | null) => void;
  readonly proofMode: ProofMode;
  readonly refetch: () => void;
  readonly refetchSummary: () => void;
}) {
  const refreshBillingData = useCallback(() => {
    refetch();
    refetchSummary();
  }, [refetch, refetchSummary]);

  const refreshAfterDialogClose = useCallback(() => {
    refetch();
    refetchSummary();
  }, [refetch, refetchSummary]);

  const openProofDialog = useCallback(
    (invoice: MarkPaidInvoiceTarget, mode: ProofMode) => {
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
    [billingActionsDisabled, showFeedback, tErrors, userId, setProofMode, setProofTarget]
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

  const handleDownloadPdf = useDownloadInvoicePdf({
    showFeedback,
    popupBlockedLabel: labels.notifications.popupBlocked,
  });

  const handleQuickPay = useCallback(() => {
    runQuickPayFlow({
      billingActionsDisabled,
      summaryLoading,
      summaryData,
      locale,
      fxMessages,
      labels,
      tErrors,
      tc,
      showFeedback,
      handlePayNow,
    });
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
    refreshBillingData,
    refreshAfterDialogClose,
    handlePayNow,
    handleMarkAsPaid,
    handleProofSuccess,
    handleProofError,
    handleDetailsSuccess,
    handleDownloadPdf,
    handleQuickPay,
  };
}

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

function buildUserBillingProfileViewModel(args: {
  readonly labels: BillingLabels;
  readonly summary: ParentBillingSummary;
  readonly summaryLoading: boolean;
  readonly metrics: ReturnType<typeof buildParentMetrics>;
  readonly invoices: readonly ParentInvoiceRow[];
  readonly searchQuery: string;
  readonly permissions: {
    readonly canManage: boolean;
    readonly canSubmitProof: boolean;
    readonly canCreate: boolean;
    readonly canView: boolean;
  };
  readonly billingActionsDisabled: boolean;
  readonly isSearchPending: boolean;
  readonly handleSearchChange: (value: string) => void;
  readonly handlePayNow: (invoice: MarkPaidInvoiceTarget) => void;
  readonly handleMarkAsPaid: (invoice: MarkPaidInvoiceTarget) => void;
  readonly handleDownloadPdf: (invoiceId: string) => void;
  readonly handleQuickPay: () => void;
  readonly page: number;
  readonly pageSize: number;
  readonly data: Operations.UserBillingProfileInvoiceHistoryQuery | undefined;
  readonly loading: boolean;
  readonly setPage: (page: number) => void;
  readonly userId: string;
  readonly dialogs: ReturnType<typeof useBillingProfileDialogs>;
  readonly refreshAfterDialogClose: () => void;
  readonly handleProofSuccess: () => void;
  readonly handleProofError: (message: string) => void;
  readonly handleDetailsSuccess: (action: "approve" | "reject") => void;
}) {
  const {
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
    handlePayNow,
    handleMarkAsPaid,
    handleDownloadPdf,
    handleQuickPay,
    page,
    pageSize,
    data,
    loading,
    setPage,
    userId,
    dialogs,
    refreshAfterDialogClose,
    handleProofSuccess,
    handleProofError,
    handleDetailsSuccess,
  } = args;
  return {
    labels,
    summary,
    summaryLoading,
    metrics,
    invoices,
    searchQuery,
    canManage: permissions.canManage,
    canSubmitProof: permissions.canSubmitProof,
    canView: permissions.canView,
    canCreate: permissions.canCreate,
    billingActionsDisabled,
    isSearchPending,
    onSearchChange: handleSearchChange,
    onPayNow: handlePayNow,
    onMarkAsPaid: permissions.canManage ? handleMarkAsPaid : undefined,
    onViewPaymentDetails: dialogs.setDetailsTarget,
    onDownloadPdf: handleDownloadPdf,
    onQuickPay: handleQuickPay,
    page,
    pageSize,
    totalCount: data?.parentInvoiceHistory?.totalCount ?? 0,
    onPageChange: setPage,
    loading: loading || isSearchPending,
    userId,
    // Dialog state and handlers needed by the view
    proofTarget: dialogs.proofTarget,
    proofMode: dialogs.proofMode,
    detailsTarget: dialogs.detailsTarget,
    snackbarOpen: dialogs.snackbarOpen,
    snackbarMessage: dialogs.snackbarMessage,
    snackbarSeverity: dialogs.snackbarSeverity,
    setProofTarget: dialogs.setProofTarget,
    setProofMode: dialogs.setProofMode,
    setDetailsTarget: dialogs.setDetailsTarget,
    setSnackbarOpen: dialogs.setSnackbarOpen,
    refreshAfterDialogClose,
    handleProofSuccess,
    handleProofError,
    handleDetailsSuccess,
  } as UserBillingProfileViewModel & {
    readonly proofTarget: MarkPaidInvoiceTarget | null;
    readonly proofMode: ProofMode;
    readonly detailsTarget: PaymentDetailsTarget | null;
    readonly snackbarOpen: boolean;
    readonly snackbarMessage: string;
    readonly snackbarSeverity: SnackbarSeverity;
    readonly setProofTarget: (target: MarkPaidInvoiceTarget | null) => void;
    readonly setProofMode: (mode: ProofMode) => void;
    readonly setDetailsTarget: (target: PaymentDetailsTarget | null) => void;
    readonly setSnackbarOpen: (open: boolean) => void;
    readonly refreshAfterDialogClose: () => void;
    readonly handleProofSuccess: () => void;
    readonly handleProofError: (message: string) => void;
    readonly handleDetailsSuccess: (action: "approve" | "reject") => void;
  };
}
