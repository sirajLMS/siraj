"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { useCallback, useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";
import {
  CurrencyCode,
  type ParentBillingSummaryQuery,
  type ParentInvoiceHistoryQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  markInvoicePaidMutationDocument,
  parentBillingSummaryQueryDocument,
  parentInvoiceHistoryQueryDocument,
  submitPaymentProofMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { type ParentBillingState, useParentBillingStore } from "@/frontend/common/stores/parentBillingStore";
import { logger } from "@/frontend/common/utils/logger";
import {
  buildInvoiceRow,
  buildParentBillingSummary,
  resolveQuickPayAction,
} from "@/frontend/common/views/dashboard/billing/__shared__/billingViewModelHelpers";
import {
  type BillingPermissions,
  useBillingPermissions,
} from "@/frontend/common/views/dashboard/billing/hooks/useBillingPermissions";
import { useDownloadInvoicePdf } from "@/frontend/common/views/dashboard/billing/hooks/useDownloadInvoicePdf";
import type {
  MarkPaidInvoiceTarget,
  ParentBillingViewProps,
} from "@/frontend/common/views/dashboard/billing/types/billingViewTypes";
import type {
  ParentBillingSummary,
  ParentInvoiceRow,
} from "@/frontend/common/views/dashboard/billing/types/parentBillingTypes";
import {
  type BillingTranslationBase,
  useBillingFxMessages,
  useBillingTranslationBase,
} from "@/frontend/common/views/dashboard/billing/utils/billingTranslationBase";

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

interface BillingTranslations extends BillingTranslationBase {
  fxMessages: ReturnType<typeof useBillingFxMessages>;
}

function useBillingTranslations(): BillingTranslations {
  const base = useBillingTranslationBase();
  const fxMessages = useBillingFxMessages(base.tProfile, base.tErrors, base.tProfileRoot);
  return { ...base, fxMessages };
}

type BillingStoreState = ParentBillingState;

function useBillingStoreState(): BillingStoreState {
  return {
    page: useParentBillingStore(state => state.page),
    pageSize: useParentBillingStore(state => state.pageSize),
    setPage: useParentBillingStore(state => state.setPage),
    searchQuery: useParentBillingStore(state => state.searchQuery),
    debouncedSearch: useParentBillingStore(state => state.debouncedSearch),
    setSearchQuery: useParentBillingStore(state => state.setSearchQuery),
    setDebouncedSearch: useParentBillingStore(state => state.setDebouncedSearch),
    showFeedback: useParentBillingStore(state => state.showFeedback),
    proofTarget: useParentBillingStore(state => state.proofTarget),
    setProofTarget: useParentBillingStore(state => state.setProofTarget),
    detailsTarget: useParentBillingStore(state => state.detailsTarget),
    setDetailsTarget: useParentBillingStore(state => state.setDetailsTarget),
    snackbarOpen: useParentBillingStore(state => state.snackbarOpen),
    snackbarMessage: useParentBillingStore(state => state.snackbarMessage),
    snackbarSeverity: useParentBillingStore(state => state.snackbarSeverity),
    closeSnackbar: useParentBillingStore(state => state.closeSnackbar),
  };
}

interface BillingSearchHandlers {
  handleSearchChange: (value: string) => void;
  isSearchPending: boolean;
}

function useBillingSearchHandlers(store: BillingStoreState): BillingSearchHandlers {
  const { setSearchQuery, setDebouncedSearch, setPage, searchQuery, debouncedSearch } = store;
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
  return { handleSearchChange, isSearchPending };
}

interface BillingData {
  invoicesData: ParentInvoiceHistoryQuery | undefined;
  summaryData: ParentBillingSummaryQuery | undefined;
  invoicesLoading: boolean;
  summaryLoading: boolean;
  refetchInvoices: () => Promise<unknown>;
  refetchSummary: () => Promise<unknown>;
}

function useBillingData(store: BillingStoreState): BillingData {
  const { page, pageSize, debouncedSearch, proofTarget, detailsTarget } = store;
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

  return { invoicesData, summaryData, invoicesLoading, summaryLoading, refetchInvoices, refetchSummary };
}

function useBillingRefresh(data: BillingData): () => void {
  const { refetchInvoices, refetchSummary } = data;
  return useCallback(() => {
    refetchInvoices().catch(() => {});
    refetchSummary().catch(() => {});
  }, [refetchInvoices, refetchSummary]);
}

interface BillingMutations {
  submittingProof: boolean;
  markingPaid: boolean;
  submitPaymentProof: (invoiceId: string, proofFileId: string) => void;
}

function useBillingMutations(
  translations: BillingTranslations,
  store: BillingStoreState,
  refreshBillingData: () => void
): BillingMutations {
  const { labels } = translations;
  const { setProofTarget, showFeedback } = store;

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

  const submitPaymentProof = useCallback(
    (invoiceId: string, proofFileId: string) => {
      submitPaymentProofMutation({
        variables: { invoiceId, proofFileId, expectedVersion: null },
      }).catch(() => {});
    },
    [submitPaymentProofMutation]
  );

  return { submittingProof, markingPaid, submitPaymentProof };
}

function useInvoiceRows(
  translations: BillingTranslations,
  data: BillingData
): { invoices: readonly ParentInvoiceRow[]; totalCount: number } {
  const { locale, fxMessages } = translations;
  const { invoicesData } = data;
  const invoices: readonly ParentInvoiceRow[] = useMemo(
    () =>
      (invoicesData?.parentInvoiceHistory?.rows ?? [])
        .filter((row): row is NonNullable<typeof row> => row != null)
        .map(inv =>
          buildInvoiceRow(inv, locale, fxMessages, { staleDefault: true, currencyDefault: CurrencyCode.Usd })
        ),
    [invoicesData?.parentInvoiceHistory, fxMessages, locale]
  );

  const totalCount = invoicesData?.parentInvoiceHistory?.totalCount ?? 0;
  return { invoices, totalCount };
}

function useBillingSummary(translations: BillingTranslations, data: BillingData): ParentBillingSummary {
  const { locale, fxMessages } = translations;
  const { summaryData } = data;
  return useMemo(() => buildParentBillingSummary(summaryData, locale, fxMessages), [summaryData, locale, fxMessages]);
}

function useQuickPayHandler(
  translations: BillingTranslations,
  permissions: BillingPermissions,
  store: BillingStoreState,
  data: BillingData,
  handlePayNow: (invoice: MarkPaidInvoiceTarget) => void
): () => void {
  const { labels, tErrors, locale, fxMessages, tc } = translations;
  const { billingActionsDisabled } = permissions;
  const { showFeedback } = store;

  return useCallback(() => {
    resolveQuickPayAction({
      billingActionsDisabled,
      summaryLoading: data.summaryLoading,
      summaryData: data.summaryData,
      locale,
      fxMessages,
      labels,
      tErrors,
      tcLoading: tc.loading,
      showFeedback,
      handlePayNow,
    });
  }, [
    billingActionsDisabled,
    handlePayNow,
    labels,
    locale,
    fxMessages,
    showFeedback,
    data.summaryData,
    data.summaryLoading,
    tErrors,
    tc.loading,
  ]);
}

interface BillingActionHandlers {
  handlePayNow: (invoice: MarkPaidInvoiceTarget) => void;
  handleQuickPay: () => void;
  handleDownloadPdf: (invoiceId: string) => void;
  handleMarkAsPaid: (invoice: MarkPaidInvoiceTarget) => void;
}

function useBillingActionHandlers(
  translations: BillingTranslations,
  permissions: BillingPermissions,
  store: BillingStoreState,
  data: BillingData
): BillingActionHandlers {
  const { labels, tErrors } = translations;
  const { canManage, billingActionsDisabled } = permissions;
  const { setProofTarget, showFeedback } = store;

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

  const handleQuickPay = useQuickPayHandler(translations, permissions, store, data, handlePayNow);

  const handleDownloadPdf = useDownloadInvoicePdf({
    showFeedback,
    popupBlockedLabel: labels.notifications.popupBlocked,
  });

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

  return { handlePayNow, handleQuickPay, handleDownloadPdf, handleMarkAsPaid };
}

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
