"use client";

import { useQuery } from "@apollo/client/react";
import type { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { recurringSchedulesQueryDocument } from "@/frontend/common/graphql/sharedDocuments/scheduling/recurring-schedule.documents";
import { useRecurringSchedulesListStore } from "@/frontend/common/stores/recurringSchedulesListStore";

type UseRecurringSchedulesListDataParams = {
  readonly initialPage: number;
  readonly initialPageSize: number;
  readonly searchParams: ReturnType<typeof useSearchParams>;
};

export function useRecurringSchedulesListData(params: UseRecurringSchedulesListDataParams) {
  const { initialPage, initialPageSize, searchParams } = params;

  const initialized = useRecurringSchedulesListStore(state => state.initialized);
  const storedPage = useRecurringSchedulesListStore(state => state.currentPage);
  const storedSearch = useRecurringSchedulesListStore(state => state.searchValue);
  const initializeListState = useRecurringSchedulesListStore(state => state.initialize);

  const urlSearch = searchParams.get("search") ?? "";
  // View-layer pages are 0-based (shared pagination contract); the `initialPage` prop and
  // the `page` URL param stay 1-based, and the GraphQL query receives `page: currentPage + 1`.
  const initialPageIndex = Math.max(0, initialPage - 1);
  const currentPage = initialized ? storedPage : initialPageIndex;
  const searchValue = initialized ? storedSearch : urlSearch;

  // Seed the store from the URL/props on first mount so subsequent handlers operate on
  // store state and the current page/search survive viewport tier switches.
  useEffect(() => {
    if (!useRecurringSchedulesListStore.getState().initialized) {
      initializeListState(urlSearch, initialPageIndex);
    }
  }, [initializeListState, urlSearch, initialPageIndex]);

  const { data, loading, error, refetch } = useQuery(recurringSchedulesQueryDocument, {
    variables: {
      pagination: {
        page: currentPage + 1,
        first: initialPageSize,
        after: null,
        before: null,
        last: null,
        maxCount: null,
        skip: null,
      },
      search: searchValue || null,
    },
  });

  return { data, loading, error, refetch, currentPage, searchValue };
}

type UseRecurringSchedulesListHandlersParams = {
  readonly router: ReturnType<typeof useRouter>;
  readonly searchParams: ReturnType<typeof useSearchParams>;
  readonly onRetry?: () => void;
  readonly refetch: () => Promise<unknown>;
};

export function useRecurringSchedulesListHandlers(params: UseRecurringSchedulesListHandlersParams) {
  const { router, searchParams, onRetry, refetch } = params;
  const setPage = useRecurringSchedulesListStore(state => state.setPage);
  const applySearch = useRecurringSchedulesListStore(state => state.applySearch);

  const handlePageChange = useCallback(
    (page: number) => {
      setPage(page);
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("page", String(page + 1));
      router.push(`?${nextParams.toString()}`, { scroll: false });
    },
    [router, searchParams, setPage]
  );

  const handleSearchChange = useCallback(
    (search: string) => {
      applySearch(search);
      const nextParams = new URLSearchParams(searchParams.toString());
      if (search) {
        nextParams.set("search", search);
      } else {
        nextParams.delete("search");
      }
      nextParams.set("page", "1");
      router.push(`?${nextParams.toString()}`, { scroll: false });
    },
    [router, searchParams, applySearch]
  );

  const handleRetry = useCallback(() => {
    if (onRetry) {
      onRetry();
    } else {
      void refetch();
    }
  }, [onRetry, refetch]);

  return { onPageChange: handlePageChange, onSearchChange: handleSearchChange, onRetry: handleRetry };
}
