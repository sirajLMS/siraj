"use client";

import { useDebouncedCallback } from "use-debounce";
import { useAdminBillingStore } from "@/frontend/common/stores/adminBillingStore";

/**
 * Binds the admin billing store to the view model: `vmState` carries only the
 * fields the view model exposes (including the debounced-search pending flag),
 * while `actions` holds the setters and internal values the hooks and handler
 * factories consume without leaking onto the public view model.
 */
export function useAdminBillingStoreBindings() {
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

  return {
    vmState: {
      page,
      pageSize,
      searchQuery,
      isSearchPending,
      creditFilter,
      onSearchChange: handleSearchChange,
      sendingReminderId,
      proofTarget,
      detailsTarget,
      deleteTargetId,
      snackbarOpen,
      snackbarMessage,
      snackbarSeverity,
    },
    actions: {
      setPage,
      setSearchQuery,
      setDebouncedSearch,
      setCreditFilter,
      setProofTarget,
      setDetailsTarget,
      setDeleteTargetId,
      setSendingReminderId,
      setSnackbarOpen,
      showFeedback,
      debouncedSearch,
      billingDialogsOpen,
    },
  };
}

export type AdminBillingStoreBindings = ReturnType<typeof useAdminBillingStoreBindings>;
