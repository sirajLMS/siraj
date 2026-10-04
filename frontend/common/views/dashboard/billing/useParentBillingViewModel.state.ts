import { useQuery } from "@apollo/client/react";
import { useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";
import type {
  ParentBillingSummaryQuery,
  ParentInvoiceHistoryQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  parentBillingSummaryQueryDocument,
  parentInvoiceHistoryQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { type ParentBillingState, useParentBillingStore } from "@/frontend/common/stores/parentBillingStore";
import {
  type BillingTranslationBase,
  useBillingFxMessages,
  useBillingTranslationBase,
} from "@/frontend/common/views/dashboard/billing/utils/billingTranslationBase";

export interface BillingTranslations extends BillingTranslationBase {
  fxMessages: ReturnType<typeof useBillingFxMessages>;
}

export function useBillingTranslations(): BillingTranslations {
  const base = useBillingTranslationBase();
  const fxMessages = useBillingFxMessages(base.tProfile, base.tErrors, base.tProfileRoot);
  return { ...base, fxMessages };
}

export type BillingStoreState = ParentBillingState;

export function useBillingStoreState(): BillingStoreState {
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

export function useBillingSearchHandlers(store: BillingStoreState): BillingSearchHandlers {
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

export interface BillingData {
  invoicesData: ParentInvoiceHistoryQuery | undefined;
  summaryData: ParentBillingSummaryQuery | undefined;
  invoicesLoading: boolean;
  summaryLoading: boolean;
  refetchInvoices: () => Promise<unknown>;
  refetchSummary: () => Promise<unknown>;
}

export function useBillingData(store: BillingStoreState): BillingData {
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

export function useBillingRefresh(data: BillingData): () => void {
  const { refetchInvoices, refetchSummary } = data;
  return useCallback(() => {
    refetchInvoices().catch(() => {});
    refetchSummary().catch(() => {});
  }, [refetchInvoices, refetchSummary]);
}
