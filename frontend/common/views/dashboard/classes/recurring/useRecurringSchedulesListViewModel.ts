"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useDocumentTitle } from "@/frontend/common/hooks/useDocumentTitle";
import type {
  RecurringSchedulesListLabelsBySection,
  RecurringSchedulesListViewModel,
  UseRecurringSchedulesListViewModelProps,
} from "@/frontend/common/views/dashboard/classes/recurring/types/recurringSchedulesListViewModel.types";
import {
  useRecurringSchedulesListData,
  useRecurringSchedulesListHandlers,
} from "@/frontend/common/views/dashboard/classes/recurring/useRecurringSchedulesListViewModel.hooks";
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

  const { data, loading, error, refetch, currentPage, searchValue } = useRecurringSchedulesListData({
    initialPage,
    initialPageSize,
    searchParams,
  });

  useDocumentTitle(t.shell.pageTitle, Translation.Common, "title");

  const {
    onPageChange,
    onSearchChange,
    onRetry: handleRetry,
  } = useRecurringSchedulesListHandlers({
    router,
    searchParams,
    onRetry,
    refetch,
  });

  const breadcrumbs = useMemo(() => buildBreadcrumbs(t.shell), [t.shell]);

  const labelsBySection = useMemo<RecurringSchedulesListLabelsBySection>(
    () => ({
      shell: {
        pageTitle: t.shell.pageTitle,
        subtitle: t.shell.subtitle,
        breadcrumbs,
        emptyMessage: t.shell.emptyMessage,
        loadError: t.shell.loadError,
        addNew: t.shell.addNew,
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
    onPageChange,
    onSearchChange,
    searchValue,
    onRetry: handleRetry,
  };
}
