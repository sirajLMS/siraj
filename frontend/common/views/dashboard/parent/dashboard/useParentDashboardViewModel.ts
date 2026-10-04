"use client";

import { useQuery } from "@apollo/client/react";

import {
  parentDashboardMetricsQueryDocument,
  parentDashboardScheduleQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useParentDashboardStore } from "@/frontend/common/stores/parentDashboardStore";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type {
  ParentDashboardMetrics,
  ParentScheduleRow,
  StudentProgressItem,
  WorkshopPromo,
} from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";
import {
  computePageCount,
  type SchedulePagination,
} from "@/frontend/common/views/dashboard/parent/dashboard/useParentDashboardViewModel.helpers";
import {
  useDashboardLabels,
  usePaginationArgs,
  useParentDashboardHandlers,
  useParentDashboardMetrics,
  useSchedulePagination,
  useScheduleRows,
  useScheduleTotalCountSync,
  useTodayIso,
} from "@/frontend/common/views/dashboard/parent/dashboard/useParentDashboardViewModel.hooks";
import { useRouter } from "@/shared/i18n/navigation";
import { type ParentDashboardLabels, Translation, useAppTranslation } from "@/shared/locale";

export type { SchedulePagination } from "@/frontend/common/views/dashboard/parent/dashboard/useParentDashboardViewModel.helpers";

export interface ParentDashboardViewModel {
  readonly userName: string;
  readonly metrics: ParentDashboardMetrics;
  readonly scheduleRows: readonly ParentScheduleRow[];
  readonly studentProgress: readonly StudentProgressItem[];
  readonly workshopPromo: WorkshopPromo | null;
  readonly schedulePagination?: SchedulePagination;
  readonly labels: ParentDashboardLabels;
  readonly onFilter: () => void;
  readonly onViewFullWeek: () => void;
  readonly onViewAll: () => void;
  readonly onHistory: (id: string) => void;
  readonly onDownloadReport: () => void;
  readonly onLearnMore: () => void;
  readonly onSupport: () => void;
  readonly pageCount: number;
}

export type UseParentDashboardViewModelProps = Record<string, never>;

export function useParentDashboardViewModel(_props: UseParentDashboardViewModelProps): ParentDashboardViewModel {
  const t = useAppTranslation(Translation.Dashboard.CoreParentDashboard);
  const router = useRouter();
  const userName = useUserStore(state => state.name);
  const page = useParentDashboardStore(state => state.page);
  const pageSize = useParentDashboardStore(state => state.pageSize);
  const setPage = useParentDashboardStore(state => state.setPage);
  const setScheduleTotalCount = useParentDashboardStore(state => state.setScheduleTotalCount);

  const paginationArgs = usePaginationArgs(page, pageSize);
  const today = useTodayIso();

  const { data: scheduleData } = useQuery(parentDashboardScheduleQueryDocument, {
    variables: { date: today, search: null, paginationArgs },
    fetchPolicy: "cache-and-network",
  });

  const { data: metricsData } = useQuery(parentDashboardMetricsQueryDocument, {
    fetchPolicy: "cache-and-network",
  });

  const { metrics, studentProgress, workshopPromo } = useParentDashboardMetrics(metricsData?.parentDashboardMetrics);

  const scheduleRows = useScheduleRows(scheduleData);
  const totalCount = scheduleData?.parentDashboardSchedule?.totalCount ?? 0;
  const labels = useDashboardLabels(t, userName);
  const handlers = useParentDashboardHandlers(router, workshopPromo, setPage);

  useScheduleTotalCountSync(totalCount, setScheduleTotalCount);

  const schedulePagination = useSchedulePagination(page, pageSize, totalCount, handlers.handlePageChange);
  const pageCount = computePageCount(schedulePagination.pageSize, schedulePagination.totalCount);

  return {
    userName,
    metrics,
    scheduleRows,
    studentProgress,
    workshopPromo,
    schedulePagination,
    labels,
    onFilter: handlers.handleFilter,
    onViewFullWeek: handlers.handleViewFullWeek,
    onViewAll: handlers.handleViewAll,
    onHistory: handlers.handleHistory,
    onDownloadReport: handlers.handleDownloadReport,
    onLearnMore: handlers.handleLearnMore,
    onSupport: handlers.handleSupport,
    pageCount,
  };
}
