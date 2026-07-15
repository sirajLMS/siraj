"use client";

import type { AdminMetricKey } from "@/frontend/common/types/shared.types";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import { ADMIN_METRIC_DEFINITIONS } from "@/frontend/common/views/dashboard/admin/home/utils/adminDashboardMetrics";
import { DashboardView } from "@/frontend/common/views/dashboard/dashboard/DashboardView";
import type {
  MetricItem,
  ScheduleOverviewData,
  TeacherFilterItem,
} from "@/frontend/common/views/dashboard/types/dashboard";
import type { AdminDashboardLabels } from "@/shared/locale/types/dashboard/admin";

type DashboardHeaders = ScheduleOverviewData["headers"];
type DashboardStatusLabels = ScheduleOverviewData["statusLabels"];

/** Input shape for {@link renderAdminDashboardView}. */
export interface AdminDashboardViewInput {
  readonly t: AdminDashboardLabels;
  readonly loading: boolean;
  readonly lastUpdated: string;
  readonly metrics: readonly MetricItem[];
  readonly onMetricClick: (key: string) => void;
  readonly selectedMetricKey?: string | undefined;
  readonly selectedMetricLabel: string | null;
  readonly searchValue: string;
  readonly dateValue: string;
  readonly teacherValue: string;
  readonly teachers: readonly TeacherFilterItem[];
  readonly rows: readonly DailyScheduleRow[];
  readonly headers: DashboardHeaders;
  readonly statusLabels: DashboardStatusLabels;
  readonly page: number;
  readonly totalCount?: number | undefined;
  readonly onPageChange: (page: number) => void;
  readonly onSearchChange: (value: string) => void;
  readonly onDateChange: (date: string) => void;
  readonly onTeacherChange: (teacher: string) => void;
  readonly onSubmit: () => void;
  readonly pageSize?: number;
  readonly loadingLabel?: string;
  readonly emptyLabel?: string;
}

/** Type guard to ensure a value is a valid AdminMetricKey. */
export function isAdminMetricKey(key: string | null): key is AdminMetricKey {
  return ADMIN_METRIC_DEFINITIONS.some((def: { key: string }) => def.key === key);
}

/** Renders the admin DashboardView using translation keys and the provided data/handlers. */
export function renderAdminDashboardView(input: AdminDashboardViewInput) {
  const {
    t,
    loading,
    lastUpdated,
    metrics,
    onMetricClick,
    selectedMetricKey,
    selectedMetricLabel,
    searchValue,
    dateValue,
    teacherValue,
    teachers,
    rows,
    headers,
    statusLabels,
    page,
    totalCount,
    onPageChange,
    onSearchChange,
    onDateChange,
    onTeacherChange,
    onSubmit,
    pageSize = 10,
    loadingLabel = t.loading,
    emptyLabel = t.noClasses,
  } = input;

  return (
    <DashboardView
      loading={loading}
      todayClassesTitle={t.todayClasses}
      lastUpdated={lastUpdated}
      metrics={metrics}
      onMetricClick={onMetricClick}
      selectedMetricKey={selectedMetricKey}
      scheduleTitle={t.scheduleOverview}
      selectedMetricLabel={selectedMetricLabel}
      todayLabel={t.today}
      previousDayLabel={t.previousDay}
      nextDayLabel={t.nextDay}
      searchPlaceholder={t.searchPlaceholder}
      searchValue={searchValue}
      dateLabel={t.listOfClassesOn}
      dateValue={dateValue}
      teacherPlaceholder={t.selectTeacher}
      teacherValue={teacherValue}
      submitLabel={t.submit}
      teachers={teachers as readonly TeacherFilterItem[]}
      rows={rows as readonly DailyScheduleRow[]}
      headers={headers}
      statusLabels={statusLabels}
      detailsLabel={t.details}
      emptyMessage={loading ? loadingLabel : emptyLabel}
      page={page}
      pageSize={pageSize}
      totalCount={totalCount}
      onPageChange={onPageChange}
      onSearchChange={onSearchChange}
      onDateChange={onDateChange}
      onTeacherChange={onTeacherChange}
      onSubmit={onSubmit}
    />
  );
}
