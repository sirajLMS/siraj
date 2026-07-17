"use client";
import {
  ADMIN_DASHBOARD_PAGE_SIZE,
  useAdminDashboardHandlers,
  useAdminScheduleQuery,
  useLastUpdatedLabel,
  useTeachers,
} from "@/frontend/common/views/dashboard/admin/__shared__/useAdminDashboard";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import { useAdminDashboardLabels } from "@/frontend/common/views/dashboard/admin/home/utils";
import { buildAdminDashboardMetrics } from "@/frontend/common/views/dashboard/admin/home/utils/adminDashboardMetrics";
import type { AdminDashboardLabels } from "@/shared/locale";
import { useAppTranslation } from "@/shared/locale";

export interface UseAdminDashboardViewModelProps {
  readonly onRetry?: () => void;
}

export interface AdminDashboardViewModel {
  readonly t: AdminDashboardLabels;
  readonly loading: boolean;
  readonly lastUpdated: string;
  readonly metrics: readonly import("@/frontend/common/views/dashboard/types/dashboard").MetricItem[];
  readonly onMetricClick: (key: string) => void;
  readonly selectedMetricKey?: string;
  readonly selectedMetricLabel: string | null;
  readonly searchValue: string;
  readonly dateValue: string;
  readonly teacherValue: string;
  readonly teachers: readonly import("@/frontend/common/views/dashboard/types/dashboard").TeacherFilterItem[];
  readonly rows: readonly DailyScheduleRow[];
  readonly headers: import("@/frontend/common/views/dashboard/types/dashboard").ScheduleOverviewData["headers"];
  readonly statusLabels: import("@/frontend/common/views/dashboard/types/dashboard").ScheduleOverviewData["statusLabels"];
  readonly page: number;
  readonly totalCount?: number;
  readonly onPageChange: (page: number) => void;
  readonly onSearchChange: (value: string) => void;
  readonly onDateChange: (date: string) => void;
  readonly onTeacherChange: (teacher: string) => void;
  readonly onSubmit: () => void;
  readonly pageSize: number;
  readonly loadingLabel?: string;
  readonly emptyLabel?: string;
  readonly pageCount: number;
}

function isAdminMetricKey(key: string | null): key is string {
  return key !== null && key !== undefined;
}

export function useAdminDashboardViewModel(_props: Readonly<UseAdminDashboardViewModelProps>): AdminDashboardViewModel {
  const t = useAppTranslation().dashboardTranslations.admin;
  const { headers, statusLabels } = useAdminDashboardLabels();

  const { dashboardData, loading, refetch, page, setPage } = useAdminScheduleQuery();
  const teachers = useTeachers();
  const lastUpdated = useLastUpdatedLabel(dashboardData);

  const { filters, handleDateChange, handleTeacherChange, handleSearchChange, handleMetricClick } =
    useAdminDashboardHandlers(setPage);

  const handleSubmit = () => {
    void refetch();
  };

  const scheduleResult = dashboardData?.adminDashboardSchedule;
  const metricsList = buildAdminDashboardMetrics(scheduleResult?.metrics ?? null);
  const rows = (scheduleResult?.rows ?? []) as unknown as readonly DailyScheduleRow[];
  const totalCount = scheduleResult ? (scheduleResult.pageInfo?.total ?? scheduleResult.totalCount ?? 0) : undefined;

  const selectedMetricLabel =
    filters.selectedStatus && isAdminMetricKey(filters.selectedStatus) ? t.metrics[filters.selectedStatus] : null;

  const pageCount =
    totalCount !== undefined && ADMIN_DASHBOARD_PAGE_SIZE > 0
      ? Math.max(1, Math.ceil(totalCount / ADMIN_DASHBOARD_PAGE_SIZE))
      : 0;

  return {
    t,
    loading,
    lastUpdated,
    metrics: metricsList,
    onMetricClick: handleMetricClick,
    selectedMetricKey: filters.selectedStatus ?? undefined,
    selectedMetricLabel,
    searchValue: filters.searchQuery,
    dateValue: filters.date,
    teacherValue: filters.teacherId,
    teachers,
    rows,
    headers,
    statusLabels,
    page,
    totalCount,
    onPageChange: setPage,
    onSearchChange: handleSearchChange,
    onDateChange: handleDateChange,
    onTeacherChange: handleTeacherChange,
    onSubmit: handleSubmit,
    pageSize: ADMIN_DASHBOARD_PAGE_SIZE,
    pageCount,
  };
}
