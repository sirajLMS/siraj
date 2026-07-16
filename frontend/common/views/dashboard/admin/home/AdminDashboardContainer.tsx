"use client";

import {
  isAdminMetricKey,
  renderAdminDashboardView,
} from "@/frontend/common/views/dashboard/admin/__shared__/adminDashboardView";
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
import { useAppTranslation } from "@/shared/locale";

// Admin Dashboard Container - orchestrates data fetching and state for the admin dashboard view
export function AdminDashboardContainer() {
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

  return renderAdminDashboardView({
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
  });
}
