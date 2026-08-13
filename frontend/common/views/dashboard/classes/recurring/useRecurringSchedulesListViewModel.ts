"use client";

import { useQuery } from "@apollo/client/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { recurringSchedulesQueryDocument } from "@/frontend/common/graphql/sharedDocuments/scheduling/recurring-schedule.documents";
import { useDocumentTitle } from "@/frontend/common/hooks/useDocumentTitle";
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

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchValue, setSearchValue] = useState(searchParams.get("search") ?? "");

  const { data, loading, error, refetch } = useQuery(recurringSchedulesQueryDocument, {
    variables: {
      pagination: {
        page: currentPage,
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
      setCurrentPage(page);
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(page));
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleSearchChange = useCallback(
    (search: string) => {
      setSearchValue(search);
      setCurrentPage(1);
      const params = new URLSearchParams(searchParams.toString());
      if (search) {
        params.set("search", search);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
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
      },
      columns: t.columns,
      actions: t.actions,
      filters: t.filters,
    }),
    [t.shell, t.columns, t.actions, t.filters, breadcrumbs]
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
