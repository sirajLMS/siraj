"use client";
import { useMemo } from "react";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import {
  ADMIN_DASHBOARD_PAGE_SIZE,
  useAdminDashboardHandlers,
  useAdminScheduleQuery,
  useLastUpdatedLabel,
} from "@/frontend/common/views/dashboard/admin/__shared__/useAdminDashboard";
import type { AdminDashboardLabelsBySection } from "@/frontend/common/views/dashboard/admin/home/types/adminDashboard.types";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import { buildAdminDashboardMetrics } from "@/frontend/common/views/dashboard/admin/home/utils/adminDashboardMetrics";
import { buildClassInstanceStatusLabels } from "@/frontend/common/views/dashboard/utils/classInstanceStatusLabels";
import type { AdminDashboardLabels } from "@/shared/locale";
import { Translation, useAppTranslation } from "@/shared/locale";

export interface UseAdminDashboardViewModelProps {
  readonly onRetry?: () => void;
}

function buildLabelsBySection(labels: AdminDashboardLabels): AdminDashboardLabelsBySection {
  return {
    shell: {
      todayClasses: labels.todayClasses,
      scheduleOverview: labels.scheduleOverview,
      searchPlaceholder: labels.searchPlaceholder,
      noClasses: labels.noClasses,
      details: labels.details,
      loading: labels.loading,
    },
    filters: {
      listOfClassesOn: labels.listOfClassesOn,
      today: labels.today,
      previousDay: labels.previousDay,
      nextDay: labels.nextDay,
      selectTeacher: labels.selectTeacher,
      submit: labels.submit,
    },
    columns: {
      className: labels.className,
      student: labels.student,
      teacher: labels.teacher,
      time: labels.time,
      yourTime: labels.yourTime,
      teacherTime: labels.teacherTime,
      studentTime: labels.studentTime,
      duration: labels.duration,
      status: labels.status,
      actions: labels.actions,
      history: labels.history,
      joinVideo: labels.joinVideo,
    },
    status: buildClassInstanceStatusLabels(labels.statusLabels),
    metrics: labels.metrics,
  };
}

export interface AdminDashboardViewModel {
  readonly labelsBySection: AdminDashboardLabelsBySection;
  readonly loading: boolean;
  readonly lastUpdated: string;
  readonly metrics: readonly MetricItem[];
  readonly onMetricClick: (key: string) => void;
  readonly selectedMetricKey?: string;
  readonly selectedMetricLabel: string | null;
  readonly searchValue: string;
  readonly dateValue: string;
  readonly selectedTeacher: PersonOption | null;
  readonly rows: readonly DailyScheduleRow[];
  readonly page: number;
  readonly totalCount?: number;
  readonly onPageChange: (page: number) => void;
  readonly onSearchChange: (value: string) => void;
  readonly onDateChange: (date: string) => void;
  readonly onTeacherChange: (teacher: PersonOption | null) => void;
  readonly onSubmit: () => void;
  readonly pageSize: number;
  readonly pageCount: number;
  readonly canDashboardSearch: boolean;
  readonly canScheduleFilterAdvanced: boolean;
  readonly canScheduleViewTimezones: boolean;
}

export function useAdminDashboardViewModel(_props: Readonly<UseAdminDashboardViewModelProps>): AdminDashboardViewModel {
  const labels = useAppTranslation(Translation.Dashboard.Admin);
  const labelsBySection = useMemo(() => buildLabelsBySection(labels), [labels]);

  const { hasPermission } = useUserStore();
  const canDashboardSearch = hasPermission(AppPermission.DashboardSearch);
  const canScheduleFilterAdvanced = hasPermission(AppPermission.ScheduleFilterAdvanced);
  const canScheduleViewTimezones = hasPermission(AppPermission.ScheduleViewTimezones);

  const { dashboardData, loading, refetch, page, setPage } = useAdminScheduleQuery();
  const lastUpdated = useLastUpdatedLabel(dashboardData, labels);

  const { filters, handleDateChange, handleTeacherChange, handleSearchChange, handleMetricClick } =
    useAdminDashboardHandlers(setPage);

  const handleSubmit = () => {
    void refetch();
  };

  const scheduleResult = dashboardData?.adminDashboardSchedule;
  const metricsList = buildAdminDashboardMetrics(scheduleResult?.metrics ?? null).map(metric => ({
    ...metric,
    label: labelsBySection.metrics[metric.key as keyof AdminDashboardLabels["metrics"]] ?? metric.labelKey,
  }));
  const rows = (scheduleResult?.rows ?? []) as unknown as readonly DailyScheduleRow[];
  const totalCount = scheduleResult ? (scheduleResult.pageInfo?.total ?? scheduleResult.totalCount ?? 0) : undefined;

  const selectedMetricLabel = filters.selectedStatus
    ? labelsBySection.metrics[filters.selectedStatus as keyof AdminDashboardLabels["metrics"]]
    : null;

  const pageCount =
    totalCount !== undefined && ADMIN_DASHBOARD_PAGE_SIZE > 0
      ? Math.max(1, Math.ceil(totalCount / ADMIN_DASHBOARD_PAGE_SIZE))
      : 0;

  return {
    labelsBySection,
    loading,
    lastUpdated,
    metrics: metricsList,
    onMetricClick: handleMetricClick,
    selectedMetricKey: filters.selectedStatus ?? undefined,
    selectedMetricLabel,
    searchValue: filters.searchQuery,
    dateValue: filters.date,
    selectedTeacher: filters.selectedTeacher,
    rows,
    page,
    totalCount,
    onPageChange: setPage,
    onSearchChange: handleSearchChange,
    onDateChange: handleDateChange,
    onTeacherChange: handleTeacherChange,
    onSubmit: handleSubmit,
    pageSize: ADMIN_DASHBOARD_PAGE_SIZE,
    pageCount,
    canDashboardSearch,
    canScheduleFilterAdvanced,
    canScheduleViewTimezones,
  };
}
