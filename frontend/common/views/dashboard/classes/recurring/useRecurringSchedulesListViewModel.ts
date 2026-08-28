"use client";

import { useQuery } from "@apollo/client/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { recurringSchedulesQueryDocument } from "@/frontend/common/graphql/sharedDocuments/scheduling/recurring-schedule.documents";
import { useDocumentTitle } from "@/frontend/common/hooks/useDocumentTitle";
import { useRecurringSchedulesListStore } from "@/frontend/common/stores/recurringSchedulesListStore";
import type {
  RecurringSchedulesListLabelsBySection,
  RecurringSchedulesListViewModel,
  UseRecurringSchedulesListViewModelProps,
} from "@/frontend/common/views/dashboard/classes/recurring/types/recurringSchedulesListViewModel.types";
import { Translation, useAppTranslation } from "@/shared/locale";

function buildBreadcrumbs(t: { breadcrumbDashboard: string; breadcrumbClasses: string; pageTitle: string }) {
  return [
    { label: t.breadcrumbDashboard, href: "/dashboard" },
    { label: t.breadcrumbClasses, href: "/classes" },
    { label: t.pageTitle },
  ];
}

export function useRecurringSchedulesListViewModel(
  props: Readonly<UseRecurringSchedulesListViewModelProps> = {}
): RecurringSchedulesListViewModel {
  const { initialPage = 1, initialPageSize = 20, onRetry } = props;

  const t = useAppTranslation(Translation.Dashboard.RecurringSchedulesList);
  const tCommon = useAppTranslation(Translation.Common);

  const router = useRouter();
  const searchParams = useSearchParams();

  const initialized = useRecurringSchedulesListStore(state => state.initialized);
  const storedPage = useRecurringSchedulesListStore(state => state.currentPage);
  const storedSearch = useRecurringSchedulesListStore(state => state.searchValue);
  const initializeListState = useRecurringSchedulesListStore(state => state.initialize);
  const setPage = useRecurringSchedulesListStore(state => state.setPage);
  const applySearch = useRecurringSchedulesListStore(state => state.applySearch);

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

  useDocumentTitle(t.shell.pageTitle, Translation.Common, "title");

  const handlePageChange = useCallback(
    (page: number) => {
      setPage(page);
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(page + 1));
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams, setPage]
  );

  const handleSearchChange = useCallback(
    (search: string) => {
      applySearch(search);
      const params = new URLSearchParams(searchParams.toString());
      if (search) {
        params.set("search", search);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.push(`?${params.toString()}`, { scroll: false });
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

  const breadcrumbs = useMemo(() => buildBreadcrumbs(t.shell), [t.shell]);

  const labelsBySection = useMemo<RecurringSchedulesListLabelsBySection>(
    () => ({
      shell: {
        pageTitle: t.shell.pageTitle,
        subtitle: t.shell.subtitle,
        breadcrumbs,
        emptyMessage: t.shell.emptyMessage,
        loadError: t.shell.loadError,
        retryLabel: tCommon.retry,
      },
      columns: t.columns,
      actions: t.actions,
      filters: t.filters,
    }),
    [t.shell, t.columns, t.actions, t.filters, tCommon.retry, breadcrumbs]
  );

  const rows = data?.recurringSchedules?.rows ?? [];
  const totalCount = data?.recurringSchedules?.totalCount ?? 0;

  return {
    labelsBySection,
    loading,
    error: error ? tCommon.loadFailed : null,
    rows,
    totalCount,
    currentPage,
    pageSize: initialPageSize,
    onPageChange: handlePageChange,
    onSearchChange: handleSearchChange,
    searchValue,
    onRetry: handleRetry,
  };
}
