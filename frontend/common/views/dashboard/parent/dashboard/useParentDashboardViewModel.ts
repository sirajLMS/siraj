"use client";

import type { ParentDashboardLabels } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardLabels";
import type {
  ParentDashboardMetrics,
  ParentScheduleRow,
  StudentProgressItem,
  WorkshopPromo,
} from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";

/**
 * ParentDashboard ViewModel.
 *
 * The container (`ParentDashboardContainer`) owns all data fetching
 * (Apollo `useQuery`), translation, side effects, and pagination state.
 * It passes a flat prop bag to this hook. Per the Phase 3c migration plan
 * and established Phase 3a/3b pattern, the ViewModel hook derives
 * presenter-only values (page count) so the mobile/desktop switcher renders
 * the same interface for both tiers. No viewport logic ever lives here.
 */

export interface SchedulePagination {
  readonly page: number;
  readonly pageSize: number;
  readonly totalCount: number;
  readonly onPageChange: (page: number) => void;
}

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
  // --- derived presenter values ----------------------------------------------
  readonly pageCount: number;
}

export type UseParentDashboardViewModelProps = Omit<ParentDashboardViewModel, "pageCount">;

export function useParentDashboardViewModel(props: UseParentDashboardViewModelProps): ParentDashboardViewModel {
  const {
    userName,
    metrics,
    scheduleRows,
    studentProgress,
    workshopPromo,
    schedulePagination,
    labels,
    onFilter,
    onViewFullWeek,
    onViewAll,
    onHistory,
    onDownloadReport,
    onLearnMore,
    onSupport,
  } = props;

  const pageCount =
    schedulePagination !== undefined && schedulePagination.pageSize > 0
      ? Math.max(1, Math.ceil(schedulePagination.totalCount / schedulePagination.pageSize))
      : 0;

  return {
    userName,
    metrics,
    scheduleRows,
    studentProgress,
    workshopPromo,
    schedulePagination,
    labels,
    onFilter,
    onViewFullWeek,
    onViewAll,
    onHistory,
    onDownloadReport,
    onLearnMore,
    onSupport,
    pageCount,
  };
}
